<script setup lang="ts">
  import { useI18n } from 'vue-i18n';

  import LanguageSwitcher from '@/components/core/language/LanguageSwitcher.vue';
  import Player from '@/components/widgets/player/Player.vue';
  import { useLive } from '@/views/live/composables/useLive';

  const { t } = useI18n();

  const { roomId, streamContent, streamStatus, incomingBitrate, videoResolution, videoFramerate } = useLive();
</script>

<template>
  <div class="py-3 px-2 mt-5">
    <div class="flex justify-between">
      <span class="text-3xl font-semibold">{{ t('LIVE_TITLE') }} - {{ roomId }}</span>
      <LanguageSwitcher />
    </div>
    <div class="border-t border-orange-500 my-2"></div>
    <div class="mt-5 lg:px-16">
      <Player :mediaStream="streamContent" :status="streamStatus" :autoplay="true" />
      <fieldset class="fieldset mt-2">
        <legend class="fieldset-legend">{{ t('LIVE_STAT') }}</legend>
        <div class="flex gap-x-4">
          <div class="flex flex-1 justify-between">
            <label>{{ t('LIVE_INCOMING_BITRATE') }}:</label>
            <span>
              <span class="font-semibold text-orange-500">{{ (incomingBitrate / 1024).toFixed(2) }}</span>
              KB/s
            </span>
          </div>
          <div class="flex flex-1 justify-between">
            <label>{{ t('LIVE_VIDEO_RESOLUTION') }}:</label>
            <span>
              <span class="font-semibold text-orange-500">{{ videoResolution || '-' }}</span>
              px
            </span>
          </div>
          <div class="flex flex-1 justify-between">
            <label>{{ t('LIVE_VIDEO_FRAMERATE') }}:</label>
            <span>
              <span class="font-semibold text-orange-500">{{ videoFramerate || '0' }}</span>
              fps
            </span>
          </div>
        </div>
      </fieldset>
    </div>
  </div>
</template>
