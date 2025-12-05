import type { Ref } from 'vue';

import type { StreamStatus } from '@/types/core/stream';

interface Live {
  clientId: Ref<string>;
  roomId: Ref<string>;
  streamContent: Ref<MediaStream | null>;
  streamStatus: Ref<StreamStatus>;
  incomingBitrate: Ref<number>;
  videoResolution: Ref<string>;
  videoFramerate: Ref<number>;
}

export type { Live };
