interface Environtment {
  baseUrl: string;
  mqttUrl: string;
  roomTopic: string;
  hostPrefix: string;
  peerPrefix: string;
}

export const env: Environtment = {
  baseUrl: import.meta.env.VITE_BASE_URL || '',
  mqttUrl: import.meta.env.VITE_MQTT_URL || 'wss://broker.emqx.io:8084/mqtt',
  roomTopic: import.meta.env.VITE_ROOM_TOPIC || 'CHNWT/L1VESTR3AM/',
  hostPrefix: import.meta.env.VITE_HOST_PREFIX || 'H0ST',
  peerPrefix: import.meta.env.VITE_PEER_PREFIX || 'P33R',
};
