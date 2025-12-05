import { computed, ref } from 'vue';

import { useScreenOrientation, useWindowSize } from '@vueuse/core';

import type { Player } from '@/model/widgets/player/player';

function usePlayer(autoPlay = false): Player {
  const videoStream = ref<HTMLVideoElement | null>(null);
  const volume = ref<number>(0);
  const previousVolume = ref<number>(1);
  const isPause = ref<boolean>(!autoPlay);
  const isMuted = ref<boolean>(true);

  const { isSupported, orientation } = useScreenOrientation();
  const { width, height } = useWindowSize();

  const isPortrait = computed(() => {
    if (isSupported) {
      return orientation.value?.startsWith('portrait') ?? false;
    }
    /* fallback */
    return height.value >= width.value;
  });

  const isLandscape = computed(() => {
    if (isSupported) {
      return orientation.value?.startsWith('landscape') ?? false;
    }
    /* fallback */
    return width.value > height.value;
  });

  const setVolume = (value: number) => {
    volume.value = value;
    if (videoStream.value) {
      videoStream.value.volume = value;
      if (value > 0) {
        isMuted.value = false;
        videoStream.value.muted = false;
      } else {
        isMuted.value = true;
        videoStream.value.muted = true;
      }
    }
  };

  const toggleVideo = () => {
    if (videoStream.value && videoStream.value.paused) {
      videoStream.value.play();
      isPause.value = false;
    } else if (videoStream.value && !videoStream.value.paused) {
      videoStream.value.pause();
      isPause.value = true;
    }
  };

  const toggleMute = () => {
    if (videoStream.value) {
      videoStream.value.muted = !videoStream.value.muted;
      isMuted.value = videoStream.value.muted;
      if (isMuted.value) {
        previousVolume.value = volume.value;
        setVolume(0);
      } else {
        setVolume(previousVolume.value);
      }
    }
  };

  const play = () => {
    if (videoStream.value) {
      videoStream.value
        .play()
        .then(() => {
          isPause.value = false;
        })
        .catch(() => {
          isPause.value = true;
        });
    }
  };

  const pause = () => {
    if (videoStream.value) {
      videoStream.value.pause();
      isPause.value = true;
    }
  };

  const stop = () => {
    if (videoStream.value) {
      videoStream.value.pause();
      videoStream.value.currentTime = 0;
      isPause.value = true;
    }
  };

  return {
    videoStream,
    volume,
    isPause,
    isMuted,
    isPortrait,
    isLandscape,
    setVolume,
    toggleVideo,
    toggleMute,
    play,
    pause,
    stop,
  };
}

export { usePlayer };
