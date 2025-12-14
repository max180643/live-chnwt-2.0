import Peer from 'peerjs';
import type { MediaConnection, PeerJSOption } from 'peerjs';

import { usePeerStore } from '@/stores/usePeerStore';
import { useToastStore } from '@/stores/useToastStore';
import { translate as t } from '@/utils/translate';

const toast = useToastStore();
const { info, success, warning, error } = toast;
const peer = usePeerStore();
const { setClient, getClient } = peer;

function createPeerClient(clientId: string, options?: PeerJSOption): Peer {
  const peerClient = options ? new Peer(options) : new Peer();

  // Bind event handlers
  peerClient.on('open', (id: string) => {
    setClient(clientId, id, true);
    success(t('TOAST_TITLE_SUCCESS'), t('PEER_CLIENT_CONNECTED'));
  });

  peerClient.on('close', () => {
    const peerId = getClient(clientId)?.peerId || '';
    setClient(clientId, peerId, false);
    info(t('TOAST_TITLE_INFO'), t('PEER_CLIENT_CLOSED'));
  });

  peerClient.on('disconnected', () => {
    const peerId = getClient(clientId)?.peerId || '';
    setClient(clientId, peerId, false);
    warning(t('TOAST_TITLE_WARNING'), t('PEER_CLIENT_DISCONNECTED'));
    peerClient.reconnect();
  });

  peerClient.on('error', (err) => {
    const peerId = getClient(clientId)?.peerId || '';
    setClient(clientId, peerId, false);
    error(t('TOAST_TITLE_ERROR'), t('PEER_CLIENT_ERROR') + `: ${err.message || t('TOAST_MESSAGE_UNKNOWN_ERROR')}`);
    console.error(`${t('PEER_CLIENT_ERROR')}:`, err);
  });

  return peerClient;
}

// Broadcast to a remote peer
function callRemotePeer(peerClient: Peer, clientId: string, peerId: string, localStream: MediaStream) {
  const call = peerClient.call(peerId, localStream);

  call.on('stream', () => {
    setMaxBitrate(call, 10000); // Set initial bitrate to 10 Mbps
  });

  call.on('error', (err) => {
    const peerId = getClient(clientId)?.peerId || '';
    setClient(clientId, peerId, false);
    error(t('TOAST_TITLE_ERROR'), t('PEER_CLIENT_ERROR') + `: ${err.message || t('TOAST_MESSAGE_UNKNOWN_ERROR')}`);
    console.error(`${t('PEER_CLIENT_ERROR')}:`, err);
  });
}

// Receive call from a remote peer
function listenForIncomingCalls(
  clientId: string,
  peerClient: Peer,
  onStreamReceived: (remoteStream: MediaStream, mediaConnection: any) => void,
) {
  // Remove previous listeners to avoid duplicates
  peerClient.off('call');

  // Listen for incoming calls
  peerClient.on('call', (call: MediaConnection) => {
    call.answer();

    call.on('stream', (remoteStream: MediaStream) => {
      onStreamReceived(remoteStream, call);
    });

    call.on('close', () => {
      const peerId = getClient(clientId)?.peerId || '';
      setClient(clientId, peerId, false);
      info(t('TOAST_TITLE_INFO'), t('PEER_CLIENT_CLOSED'));
    });

    call.on('error', (err) => {
      const peerId = getClient(clientId)?.peerId || '';
      setClient(clientId, peerId, false);
      error(t('TOAST_TITLE_ERROR'), t('PEER_CLIENT_ERROR') + `: ${err.message || t('TOAST_MESSAGE_UNKNOWN_ERROR')}`);
      console.error(`${t('PEER_CLIENT_ERROR')}:`, err);
    });
  });
}

// Set maximum bitrate (bitrate in kbps)
function setMaxBitrate(call: MediaConnection, bitrateKbps: number) {
  const pc = call.peerConnection as RTCPeerConnection;
  pc.getSenders().forEach((sender) => {
    if (sender.track?.kind === 'video') {
      const params = sender.getParameters();
      if (!params.encodings) params.encodings = [{}];
      if (params.encodings && params.encodings[0]) {
        params.encodings[0].maxBitrate = bitrateKbps * 1000;
      }
      sender.setParameters(params);
    }
  });
}

export { createPeerClient, callRemotePeer, listenForIncomingCalls };
