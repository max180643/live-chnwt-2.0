import mqtt from 'mqtt';

import { env } from '@/env/constants';
import { useMqttStore } from '@/stores/useMqttStore';
import { useToastStore } from '@/stores/useToastStore';
import { translate as t } from '@/utils/translate';

const toast = useToastStore();
const { info, success, warning, error } = toast;
const mqttStore = useMqttStore();
const { setClient } = mqttStore;

function createMqttClient(clientId: string): mqtt.MqttClient {
  const mqttClient = mqtt.connect(env.mqttUrl, { clientId: clientId });

  // Bind event handlers
  mqttClient.on('offline', () => {
    setClient(clientId, false);
    warning(t('MQTT_CLIENT_OFFLINE'), t('MQTT_CLIENT_OFFLINE'));
  });

  mqttClient.on('connect', () => {
    setClient(clientId, true);
    success(t('TOAST_TITLE_SUCCESS'), t('MQTT_CLIENT_CONNECTED'));
  });

  mqttClient.on('disconnect', () => {
    setClient(clientId, false);
    warning(t('TOAST_TITLE_WARNING'), t('MQTT_CLIENT_DISCONNECTED'));
  });

  mqttClient.on('reconnect', () => {
    setClient(clientId, false);
    info(t('TOAST_TITLE_INFO'), t('MQTT_CLIENT_RECONNECTING'));
  });

  mqttClient.on('end', () => {
    setClient(clientId, false);
    info(t('TOAST_TITLE_INFO'), t('MQTT_CLIENT_ENDED'));
  });

  mqttClient.on('close', () => {
    setClient(clientId, false);
    info(t('TOAST_TITLE_INFO'), t('MQTT_CLIENT_CLOSED'));
  });

  mqttClient.on('error', (err) => {
    setClient(clientId, false);
    error(t('TOAST_TITLE_ERROR'), t('MQTT_CLIENT_ERROR') + `: ${err}`);
  });

  return mqttClient;
}

function subscribe(mqttClient: mqtt.MqttClient, topic: string, handler: (topic: string, message: Buffer) => void) {
  mqttClient.subscribe(topic, (err) => {
    if (err) {
      error(t('TOAST_TITLE_ERROR'), `${t('MQTT_CLIENT_SUBSCRIBE_FAIL')} ${topic}`);
      console.error(`${t('MQTT_CLIENT_SUBSCRIBE_FAIL')} ${topic}:`, err);
    }
  });
  mqttClient.on('message', (msgTopic, message) => {
    if (msgTopic === topic) {
      handler(msgTopic, message);
    }
  });
}

function publish(mqttClient: mqtt.MqttClient, topic: string, message: string | Buffer) {
  mqttClient.publish(topic, message, (err) => {
    if (err) {
      error(t('TOAST_TITLE_ERROR'), `${t('MQTT_CLIENT_PUBLISH_FAIL')} ${topic}`);
      console.error(`${t('MQTT_CLIENT_PUBLISH_FAIL')} ${topic}:`, err);
    }
  });
}

function unsubscribe(mqttClient: mqtt.MqttClient, topic: string) {
  mqttClient.unsubscribe(topic, (err) => {
    if (err) {
      error(t('TOAST_TITLE_ERROR'), `${t('MQTT_CLIENT_UNSUBSCRIBE_FAIL')} ${topic}`);
      console.error(`${t('MQTT_CLIENT_UNSUBSCRIBE_FAIL')} ${topic}:`, err);
    }
  });
}

export { createMqttClient, subscribe, unsubscribe, publish };
