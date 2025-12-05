import { ref } from 'vue';

import { defineStore } from 'pinia';

type MqttClient = {
  clientId: string;
  status: boolean;
};

type MqttClients = {
  [clientId: string]: MqttClient;
};

const useMqttStore = defineStore('mqtt', () => {
  const clients = ref<MqttClients>({});

  function setClient(clientId: string, status: boolean) {
    clients.value[clientId] = { clientId, status };
  }

  function getClient(clientId: string): MqttClient | undefined {
    return clients.value[clientId];
  }

  return {
    clients,
    setClient,
    getClient,
  };
});

export { useMqttStore };
