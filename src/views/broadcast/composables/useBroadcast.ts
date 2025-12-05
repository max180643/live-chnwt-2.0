import { onMounted, onUnmounted, ref, watch } from 'vue';
import type { Ref } from 'vue';

import mqtt from 'mqtt';
import { nanoid } from 'nanoid';
import type Peer from 'peerjs';
import type { MediaConnection } from 'peerjs';
import { useRoute } from 'vue-router';

import { env } from '@/env/constants';
import type { CommunicationMessage } from '@/model/core/mqtt/mqtt';
import { createMqttClient, publish, subscribe } from '@/services/mqtt';
import { createPeerClient } from '@/services/peerjs';
import type { StreamStatus } from '@/types/core/stream';
import { JsonParseSafe } from '@/utils/json';

import type { Broadcast } from '../models/broadcast';
import type { StreamSource } from '../types/broadcast';

function useBroadcast(): Broadcast {
  const mqttClient: Ref<mqtt.MqttClient | null> = ref(null);
  const peerClient: Ref<Peer | null> = ref(null);
  const clientId: Ref<string> = ref(`${env.hostPrefix}-${nanoid(6)}`);
  const roomId: Ref<string> = ref('');
  const streamUrl: Ref<string> = ref('');
  const streamSource: Ref<StreamSource> = ref();
  const streamStatus: Ref<StreamStatus> = ref('offline');
  const streamContent: Ref<MediaStream | null> = ref(null);
  const streamMixedContent: Ref<MediaStream | null> = ref(null);
  const audioVolumes: Ref<number[]> = ref([]);
  const audioLevels: Ref<number[]> = ref([]);
  const videoDevices: Ref<MediaDeviceInfo[]> = ref([]);
  const audioDevices: Ref<MediaDeviceInfo[]> = ref([]);
  const selectedVideoDeviceId: Ref<string> = ref('');
  const selectedAudioDeviceId: Ref<string> = ref('');
  const enableMic: Ref<boolean> = ref(false);
  const activePeerCalls: Ref<Record<string, MediaConnection>> = ref({});

  let audioContexts: AudioContext[] = [];
  let analyserNodes: AnalyserNode[] = [];
  let animationFrame: number;

  const getMicrophoneMediaStream = async (audioDeviceId: string): Promise<MediaStream | null> => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: audioDeviceId ? { exact: audioDeviceId } : undefined,
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });
      return mediaStream;
    } catch (error) {
      console.error('Error getting microphone media stream:', error);
      return null;
    }
  };

  const getScreenCaptureMediaStream = async (
    audioDeviceId: string,
    enableMic: boolean,
  ): Promise<MediaStream | null> => {
    try {
      const mediaStream = await (navigator.mediaDevices as any).getDisplayMedia({
        video: {
          cursor: 'always',
          aspectRatio: 16 / 9,
          width: { ideal: 1920, max: 3840 },
          height: { ideal: 1080, max: 2160 },
          frameRate: { ideal: 60, max: 60 },
        },
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          sampleRate: 44100,
        },
        preferCurrentTab: false,
      });

      if (enableMic) {
        const micStream = await getMicrophoneMediaStream(audioDeviceId);
        if (micStream) {
          micStream.getAudioTracks().forEach((track) => {
            mediaStream.addTrack(track);
          });
        }
      }

      return mediaStream;
    } catch (error) {
      console.error('Error getting screen capture media stream:', error);
      return null;
    }
  };

  const getCameraMediaStream = async (
    videoDeviceId: string,
    audioDeviceId: string,
    enableMic: boolean,
  ): Promise<MediaStream | null> => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: videoDeviceId ? { exact: videoDeviceId } : undefined,
          aspectRatio: 16 / 9,
          width: { ideal: 1920, max: 3840 },
          height: { ideal: 1080, max: 2160 },
          frameRate: { ideal: 60, max: 60 },
        },
        audio: enableMic
          ? {
              deviceId: audioDeviceId ? { exact: audioDeviceId } : undefined,
              echoCancellation: true,
              noiseSuppression: true,
              sampleRate: 44100,
            }
          : false,
      });
      return mediaStream;
    } catch (error) {
      console.error('Error getting camera media stream:', error);
      return null;
    }
  };

  const screenCaptureHandler = async (audioDeviceId: string, enableMic: boolean) => {
    // Stop previous stream tracks
    if (streamContent.value) {
      streamContent.value.getTracks().forEach((track) => track.stop());
    }
    const mediaStream = await getScreenCaptureMediaStream(audioDeviceId, enableMic);
    if (mediaStream) {
      streamSource.value = 'screen';
      streamContent.value = mediaStream;
    }
  };

  const cameraCaptureHandler = async (videoDeviceId: string, audioDeviceId: string, enableMic: boolean) => {
    // Stop previous stream tracks
    if (streamContent.value) {
      streamContent.value.getTracks().forEach((track) => track.stop());
    }
    const mediaStream = await getCameraMediaStream(videoDeviceId, audioDeviceId, enableMic);
    if (mediaStream) {
      streamSource.value = 'camera';
      streamContent.value = mediaStream;
    }
  };

  const resetStreamSource = () => {
    streamSource.value = undefined;

    // Stop all media tracks
    if (streamContent.value) {
      streamContent.value.getTracks().forEach((track) => track.stop());
    }
    if (streamMixedContent.value) {
      streamMixedContent.value.getTracks().forEach((track) => track.stop());
    }

    // Clear streams
    streamContent.value = null;
    streamMixedContent.value = null;
  };

  const setTrackVolume = (idx: number, value: number) => {
    audioVolumes.value[idx] = Number(value);
  };

  const createMixedStream = (stream: MediaStream, volumes: number[]): MediaStream => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const destination = audioContext.createMediaStreamDestination();

    /* Mix audio tracks with gain */
    stream.getAudioTracks().forEach((track, idx) => {
      const source = audioContext.createMediaStreamSource(new MediaStream([track]));
      const gainNode = audioContext.createGain();
      gainNode.gain.value = volumes[idx] ?? 1;
      source.connect(gainNode).connect(destination);
    });

    /* Create new MediaStream with mixed audio and original video */
    const mixedStream = new MediaStream();
    stream.getVideoTracks().forEach((videoTrack) => {
      mixedStream.addTrack(videoTrack);
    });
    destination.stream.getAudioTracks().forEach((audioTrack) => {
      mixedStream.addTrack(audioTrack);
    });

    return mixedStream;
  };

  const setupAudioMeters = (stream: MediaStream) => {
    // Clean up previous
    audioContexts.forEach((ctx) => ctx.close());
    audioContexts = [];
    analyserNodes = [];
    audioLevels.value = [];

    stream.getAudioTracks().forEach((track, _) => {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = ctx.createMediaStreamSource(new MediaStream([track]));
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      audioContexts.push(ctx);
      analyserNodes.push(analyser);
      audioLevels.value.push(0);
    });

    function updateLevels() {
      analyserNodes.forEach((analyser, idx) => {
        if (!analyser) return;

        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteTimeDomainData(data);

        /* Calculate RMS (root mean square) volume */
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const normalized = (Number(data[i]) - 128) / 128;
          sum += normalized * normalized;
        }
        const rms = Math.sqrt(sum / data.length);

        /* Ensure array slot exists before writing */
        if (!audioLevels.value[idx]) {
          audioLevels.value[idx] = 0;
        }

        audioLevels.value[idx] = rms;
      });

      animationFrame = requestAnimationFrame(updateLevels);
    }

    updateLevels();
  };

  const handleIncomingMessage = (topic: string, payload: string) => {
    const incoming: CommunicationMessage = JsonParseSafe<CommunicationMessage>(payload, {
      type: 'unknown',
      clientId: '',
      message: '',
    });

    // Handle peer requests for stream
    if (incoming.type === 'peer' && incoming.clientId !== clientId.value) {
      const pattern = /^stream:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (pattern.test(incoming.message) && streamStatus.value === 'live') {
        const peerId = incoming.message.replace('stream:', '');
        broadcastStreamToPeer(peerId);
      }
    }
  };

  const broadcastStreamToPeer = (peerId: string) => {
    if (peerClient.value && streamMixedContent.value) {
      const call = peerClient.value.call(peerId, streamMixedContent.value);
      activePeerCalls.value[peerId] = call;
    }
  };

  const startLiveStream = () => {
    const roomTopic = `${env.roomTopic}${roomId.value}`;

    // Subscribe to room topic to signal live start
    if (mqttClient.value) {
      let client: mqtt.MqttClient = mqttClient.value as mqtt.MqttClient;
      subscribe(client, roomTopic, (topic, message) => {
        handleIncomingMessage(topic, message.toString());
      });
    }

    // Publish live start message
    const message: CommunicationMessage = {
      type: 'host',
      clientId: clientId.value,
      message: 'stream:live',
    };
    if (mqttClient.value) {
      let client: mqtt.MqttClient = mqttClient.value as mqtt.MqttClient;
      publish(client, roomTopic, JSON.stringify(message));
    }

    // Update stream status
    streamStatus.value = 'live';
  };

  const stopLiveStream = () => {
    const roomTopic = `${env.roomTopic}${roomId.value}`;

    // Publish live stop message
    const message: CommunicationMessage = {
      type: 'host',
      clientId: clientId.value,
      message: 'stream:offline',
    };
    if (mqttClient.value) {
      mqttClient.value.publish(roomTopic, JSON.stringify(message));
    }

    // Unsubscribe to room topic
    if (mqttClient.value) {
      mqttClient.value.unsubscribe(roomTopic);
    }

    // Close all active peer calls
    Object.values(activePeerCalls.value).forEach((call) => {
      call.close();
    });
    activePeerCalls.value = {};

    // Reset stream source
    resetStreamSource();

    // Update stream status
    streamStatus.value = 'offline';
  };

  onMounted(() => {
    roomId.value = getRoomId();
    streamUrl.value = getStreamUrl(roomId.value);

    peerClient.value = createPeerClient(clientId.value);
    mqttClient.value = createMqttClient(clientId.value);

    // Call stopLiveStream on tab close or reload
    window.addEventListener('beforeunload', stopLiveStream);
  });

  onUnmounted(() => {
    window.removeEventListener('beforeunload', stopLiveStream);
  });

  /* Fetch available media devices */
  onMounted(async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    videoDevices.value = devices.filter((d) => d.kind === 'videoinput');
    audioDevices.value = devices.filter((d) => d.kind === 'audioinput');
    if (videoDevices.value.length && videoDevices.value[0])
      selectedVideoDeviceId.value = videoDevices.value[0].deviceId;
    if (audioDevices.value.length && audioDevices.value[0])
      selectedAudioDeviceId.value = audioDevices.value[0].deviceId;
  });

  watch(
    streamContent,
    (newStream) => {
      if (newStream) {
        // Create mixed stream with initial volumes
        audioVolumes.value = newStream.getAudioTracks().map(() => 1) ?? [];
        streamMixedContent.value = createMixedStream(newStream, audioVolumes.value);
        setupAudioMeters(newStream);
      } else {
        streamMixedContent.value = null;
        cancelAnimationFrame(animationFrame);
        audioLevels.value = [];
        audioContexts.forEach((ctx) => ctx.close());
        audioContexts = [];
        analyserNodes = [];
      }
    },
    { immediate: true },
  );

  watch(
    audioVolumes,
    (volumes) => {
      if (streamContent.value && volumes) {
        streamMixedContent.value = createMixedStream(streamContent.value, volumes);
      }
    },
    { immediate: true, deep: true },
  );

  watch(
    streamMixedContent,
    (newStream) => {
      if (newStream) {
        // Re-broadcast to all active peer calls
        Object.values(activePeerCalls.value).forEach((call) => {
          // Replace audio tracks
          const senders = call.peerConnection.getSenders();
          const newAudioTracks = newStream.getAudioTracks();
          senders
            .filter((s) => s.track && s.track.kind === 'audio')
            .forEach((sender, idx) => {
              if (newAudioTracks[idx]) sender.replaceTrack(newAudioTracks[idx]);
            });
          // Replace video tracks
          const newVideoTracks = newStream.getVideoTracks();
          senders
            .filter((s) => s.track && s.track.kind === 'video')
            .forEach((sender, idx) => {
              if (newVideoTracks[idx]) sender.replaceTrack(newVideoTracks[idx]);
            });
        });
      }
    },
    { immediate: true },
  );

  return {
    clientId,
    roomId,
    streamUrl,
    streamSource,
    streamStatus,
    streamContent,
    streamMixedContent,
    audioVolumes,
    audioLevels,
    screenCaptureHandler,
    cameraCaptureHandler,
    resetStreamSource,
    startLiveStream,
    stopLiveStream,
    setTrackVolume,
    videoDevices,
    audioDevices,
    selectedVideoDeviceId,
    selectedAudioDeviceId,
    enableMic,
  };
}

function getRoomId(): string {
  const route = useRoute();
  const existingRoomId = route.query.id as string | undefined;
  const ramdomRoomId = nanoid(10);
  return existingRoomId ?? ramdomRoomId;
}

function getStreamUrl(roomId: string): string {
  return `${window.location.origin}/live/${roomId}`;
}

export { useBroadcast };
