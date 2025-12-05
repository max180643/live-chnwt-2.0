interface CommunicationMessage {
  type: 'peer' | 'host' | 'unknown';
  clientId: string;
  message: string;
}

export type { CommunicationMessage };
