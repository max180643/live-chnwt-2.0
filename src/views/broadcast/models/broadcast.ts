import type { Ref } from 'vue';

import type { StreamStatus } from '@/types/core/stream';

import type { StreamSource } from '../types/broadcast';

interface Broadcast {
  clientId: Ref<string>;
  roomId: Ref<string>;
  streamUrl: Ref<string>;
  streamSource: Ref<StreamSource>;
  streamStatus: Ref<StreamStatus>;
  streamContent: Ref<MediaStream | null>;
  streamMixedContent: Ref<MediaStream | null>;
  audioVolumes: Ref<number[]>;
  audioLevels: Ref<number[]>;
  screenCaptureHandler: (audioDeviceId: string, enableMic: boolean) => Promise<void>;
  cameraCaptureHandler: (videoDeviceId: string, audioDeviceId: string, enableMic: boolean) => Promise<void>;
  resetStreamSource: () => void;
  startLiveStream: () => void;
  stopLiveStream: () => void;
  setTrackVolume: (idx: number, value: number) => void;
  videoDevices: Ref<MediaDeviceInfo[]>;
  audioDevices: Ref<MediaDeviceInfo[]>;
  selectedVideoDeviceId: Ref<string>;
  selectedAudioDeviceId: Ref<string>;
  enableMic: Ref<boolean>;
}

export type { Broadcast };
