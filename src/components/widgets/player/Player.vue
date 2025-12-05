<script setup lang="ts">
  import { watch } from 'vue';

  import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
  import { UseFullscreen } from '@vueuse/components';
  import { useI18n } from 'vue-i18n';

  import Cover from '@/assets/images/cover.png';
  import { usePlayer } from '@/composables/widgets/player/usePlayer';
  import type { StreamStatus } from '@/types/core/stream';

  const props = defineProps<{
    mediaStream: MediaStream | null;
    status: StreamStatus;
    autoplay?: boolean;
  }>();

  const { t } = useI18n();
  const { videoStream, volume, isPause, isMuted, isPortrait, isLandscape, toggleVideo, toggleMute, setVolume } =
    usePlayer(props.autoplay ?? false);

  watch(
    () => props.mediaStream,
    (newStream) => {
      if (videoStream.value && newStream) {
        videoStream.value.srcObject = newStream;
      } else if (videoStream.value && !newStream) {
        videoStream.value.srcObject = null;
      }
    },
    { immediate: true },
  );
</script>

<template>
  <UseFullscreen v-slot="{ toggle: toggleFullscreen, isFullscreen, isSupported }">
    <div
      class="flex justify-center items-center rounded bg-black"
      :class="[isFullscreen ? 'w-screen h-screen rounded-none' : '']"
    >
      <div class="relative">
        <!-- overlay status -->
        <div
          class="w-fit rounded-lg px-1 py-0.5 drop-shadow z-50 absolute mt-3 ml-2 transition-opacity duration-300"
          :class="[
            props.status === 'live' ? 'bg-green-400' : '',
            props.status === 'paused' ? 'bg-yellow-400' : '',
            props.status === 'offline' ? 'bg-red-400' : '',
          ]"
        >
          <span class="text-sm text-white capitalize font-semibold">
            {{ t(`STATUS_${props.status.toUpperCase()}`) }}
          </span>
        </div>
        <!-- controls -->
        <div class="w-full z-50 absolute bottom-0 mb-3 px-2 transition-opacity duration-300">
          <div class="flex justify-between items-center">
            <!-- left controls -->
            <div class="flex items-center">
              <!-- play/pause -->
              <button class="mx-1.5 cursor-pointer" v-if="isPause" @click="toggleVideo">
                <FontAwesomeIcon
                  icon="play"
                  class="text-orange-500 drop-shadow hover:text-orange-400"
                  :class="[isFullscreen ? 'text-lg' : '']"
                />
              </button>
              <button class="mx-1.5 cursor-pointer" v-if="!isPause" @click="toggleVideo">
                <FontAwesomeIcon
                  icon="pause"
                  class="text-orange-500 drop-shadow hover:text-orange-400"
                  :class="[isFullscreen ? 'text-lg' : '']"
                />
              </button>
              <!-- mute/unmute -->
              <button class="mx-1.5 cursor-pointer" v-if="isMuted" @click="toggleMute">
                <FontAwesomeIcon
                  icon="volume-xmark"
                  class="text-orange-500 drop-shadow hover:text-orange-400"
                  :class="[isFullscreen ? 'text-lg' : '']"
                />
              </button>
              <button class="mx-1.5 cursor-pointer" v-if="!isMuted" @click="toggleMute">
                <FontAwesomeIcon
                  icon="volume-high"
                  class="text-orange-500 drop-shadow hover:text-orange-400"
                  :class="[isFullscreen ? 'text-lg' : '']"
                />
              </button>
              <!-- volume control -->
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                class="cursor-pointer accent-orange-500 hover:accent-orange-400 drop-shadow w-16 h-1.5"
                :class="[isFullscreen ? 'w-16 mb-1' : '']"
                v-model="volume"
                @input="setVolume(volume)"
              />
            </div>
            <!-- right controls -->
            <div class="flex items-center">
              <button class="mx-1.5 cursor-pointer" @click="toggleFullscreen" v-if="isSupported">
                <FontAwesomeIcon
                  icon="maximize"
                  class="text-orange-500 drop-shadow hover:text-orange-400"
                  :class="[isFullscreen ? 'text-lg' : '']"
                />
              </button>
            </div>
          </div>
        </div>
        <!-- video -->
        <video
          ref="videoStream"
          class="object-contain drop-shadow aspect-video"
          :class="[
            isFullscreen && isPortrait ? 'rounded-none w-screen' : 'rounded',
            isFullscreen && isLandscape ? 'rounded-none h-screen' : 'rounded',
          ]"
          :autoplay="props.autoplay"
          playsinline
          muted
          :poster="Cover"
        >
          <track kind="metadata" />
        </video>
      </div>
    </div>
  </UseFullscreen>
</template>
