import { ref } from 'vue';

import { defineStore } from 'pinia';

type PeerClient = {
  peerId: string;
  status: boolean;
};

type PeerClients = {
  [clientId: string]: PeerClient;
};

const usePeerStore = defineStore('peer', () => {
  const clients = ref<PeerClients>({});

  function setClient(clientId: string, peerId: string, status: boolean) {
    clients.value[clientId] = { peerId, status };
  }

  function getClient(clientId: string): PeerClient | undefined {
    return clients.value[clientId];
  }

  return {
    clients,
    setClient,
    getClient,
  };
});

export { usePeerStore };
