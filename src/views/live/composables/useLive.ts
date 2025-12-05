import { onMounted, ref, watch } from 'vue';
import type { Ref } from 'vue';

import mqtt from 'mqtt';
import { nanoid } from 'nanoid';
import type { Peer } from 'peerjs';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';

import { env } from '@/env/constants';
import type { CommunicationMessage } from '@/model/core/mqtt/mqtt';
import { createMqttClient, publish, subscribe } from '@/services/mqtt';
import { createPeerClient, listenForIncomingCalls } from '@/services/peerjs';
import { useMqttStore } from '@/stores/useMqttStore';
import { usePeerStore } from '@/stores/usePeerStore';
import type { StreamStatus } from '@/types/core/stream';
import { JsonParseSafe } from '@/utils/json';

import type { Live } from '../models/live';

function useLive(): Live {
  const mqttClient: Ref<mqtt.MqttClient | null> = ref(null);
  const peerClient: Ref<Peer | null> = ref(null);
  const clientId: Ref<string> = ref(`${env.peerPrefix}-${nanoid(6)}`);
  const roomId: Ref<string> = ref('');
  const streamContent: Ref<MediaStream | null> = ref(null);
  const streamStatus: Ref<StreamStatus> = ref('offline');
  const incomingBitrate: Ref<number> = ref(0);
  const videoResolution: Ref<string> = ref('');
  const videoFramerate: Ref<number> = ref(0);

  const { clients: mqttClients } = storeToRefs(useMqttStore());
  const { clients: peerClients } = storeToRefs(usePeerStore());

  let bitrateInterval: NodeJS.Timeout | null = null;
  let lastBytesReceived = 0;
  let lastTimestamp = 0;
  let peerConnection: RTCPeerConnection | null = null;

  const handleIncomingMessage = (topic: string, payload: string) => {
    const incoming: CommunicationMessage = JsonParseSafe<CommunicationMessage>(payload, {
      type: 'unknown',
      clientId: '',
      message: '',
    });

    // Handle host signals for live stream
    if (incoming.type === 'host' && incoming.clientId !== clientId.value) {
      // Host notifies that the stream is live
      if (incoming.message === 'stream:live') {
        if (peerClient.value && peerClients.value[clientId.value]?.status) {
          requestStreamFromHost(topic, peerClients.value[clientId.value]?.peerId ?? '');
        }
      }

      // Host notifies that the stream is offline
      if (incoming.message === 'stream:offline') {
        streamStatus.value = 'offline';
        streamContent.value = null;
      }
    }
  };

  const requestStreamFromHost = (roomTopic: string, peerId: string) => {
    // Publish peer request for stream
    const outcoming: CommunicationMessage = {
      type: 'peer',
      clientId: clientId.value,
      message: `stream:${peerId}`,
    };

    if (mqttClient.value) {
      publish(mqttClient.value, roomTopic, JSON.stringify(outcoming));
    }
  };

  const onStreamReceived = (remoteStream: MediaStream, mediaConnection?: any) => {
    streamStatus.value = 'live';
    streamContent.value = remoteStream;

    // Get RTCPeerConnection from MediaConnection
    if (mediaConnection && mediaConnection.peerConnection) {
      peerConnection = mediaConnection.peerConnection;
    }

    // Clear previous interval if any
    if (bitrateInterval) clearInterval(bitrateInterval);

    if (peerConnection) {
      bitrateInterval = setInterval(async () => {
        const stats = await peerConnection!.getStats();
        let width = 0;
        let height = 0;
        let framerate = 0;
        stats.forEach((report) => {
          // Video stats
          if (report.type === 'inbound-rtp' && report.kind === 'video') {
            if (lastTimestamp && lastBytesReceived) {
              const timeDiff = (report.timestamp - lastTimestamp) / 1000; // seconds
              const bytesDiff = report.bytesReceived - lastBytesReceived;
              incomingBitrate.value = (bytesDiff * 8) / timeDiff; // bits per second
            }
            lastTimestamp = report.timestamp;
            lastBytesReceived = report.bytesReceived;
            if (report.frameWidth && report.frameHeight) {
              width = report.frameWidth;
              height = report.frameHeight;
            }
            if (report.framesPerSecond) {
              framerate = report.framesPerSecond;
            }
          }
          // Video track stats (for resolution)
          if (report.type === 'track' && report.kind === 'video') {
            if (report.frameWidth && report.frameHeight) {
              width = report.frameWidth;
              height = report.frameHeight;
            }
            if (report.framesPerSecond) {
              framerate = report.framesPerSecond;
            }
          }
          // Audio stats
          if (report.type === 'inbound-rtp' && report.kind === 'audio') {
            if (report.audioLevel) {
              // Optionally use audioLevel
            }
          }
        });
        videoResolution.value = width && height ? `${width}x${height}` : '';
        videoFramerate.value = framerate;
      }, 1000);
    }
  };

  onMounted(() => {
    roomId.value = getRoomId();

    peerClient.value = createPeerClient(clientId.value);
    mqttClient.value = createMqttClient(clientId.value);
  });

  watch(
    [mqttClients, peerClients],
    ([mqtt, peer]) => {
      const roomTopic = `${env.roomTopic}${roomId.value}`;

      // Subscribe to room topic and request stream when both clients are connected
      if (mqttClient.value && mqtt[clientId.value]?.status && peerClient.value && peer[clientId.value]?.status) {
        subscribe(mqttClient.value, roomTopic, (topic, message) => {
          handleIncomingMessage(topic, message.toString());
        });
        requestStreamFromHost(roomTopic, peer[clientId.value]?.peerId ?? '');
      }

      if (peerClient.value && peer[clientId.value]?.status) {
        listenForIncomingCalls(peerClient.value, (remoteStream: MediaStream, mediaConnection: any) => {
          onStreamReceived(remoteStream, mediaConnection);
        });
      }
    },
    { immediate: true, deep: true },
  );

  watch(
    peerClients,
    (peer) => {
      if (!peer[clientId.value]?.status) {
        streamStatus.value = 'offline';
        streamContent.value = null;
      }
    },
    { immediate: true, deep: true },
  );

  watch(
    streamStatus,
    (status) => {
      if (status === 'offline' && bitrateInterval) {
        clearInterval(bitrateInterval);
        bitrateInterval = null;
        incomingBitrate.value = 0;
        videoResolution.value = '-';
        videoFramerate.value = 0;
        lastBytesReceived = 0;
        lastTimestamp = 0;
      }
    },
    { immediate: true },
  );

  return {
    clientId,
    roomId,
    streamContent,
    streamStatus,
    incomingBitrate,
    videoResolution,
    videoFramerate,
  };
}

function getRoomId(): string {
  const route = useRoute();
  const roomId = route.params.id as string | '';
  return roomId;
}

export { useLive };
