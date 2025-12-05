import type { Ref } from 'vue';

interface Player {
  videoStream: Ref<HTMLVideoElement | null>;
  volume: Ref<number>;
  isPause: Ref<boolean>;
  isMuted: Ref<boolean>;
  isPortrait: Ref<boolean>;
  isLandscape: Ref<boolean>;
  setVolume: (value: number) => void;
  toggleVideo: () => void;
  toggleMute: () => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
}

export type { Player };
