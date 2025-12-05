<script setup lang="ts">
  import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
  import { useClipboard } from '@vueuse/core';
  import { storeToRefs } from 'pinia';
  import { useI18n } from 'vue-i18n';

  import LanguageSwitcher from '@/components/core/language/LanguageSwitcher.vue';
  import Player from '@/components/widgets/player/Player.vue';
  import { useMqttStore } from '@/stores/useMqttStore';
  import { usePeerStore } from '@/stores/usePeerStore';
  import { useToastStore } from '@/stores/useToastStore';

  import { useBroadcast } from './composables/useBroadcast';

  const {
    clientId,
    streamUrl,
    streamSource,
    streamStatus,
    streamContent,
    streamMixedContent,
    audioVolumes,
    audioLevels,
    screenCaptureHandler,
    cameraCaptureHandler,
    resetStreamSource,
    startLiveStream,
    stopLiveStream,
    setTrackVolume,
    videoDevices,
    audioDevices,
    selectedVideoDeviceId,
    selectedAudioDeviceId,
    enableMic,
  } = useBroadcast();
  const { copy, isSupported } = useClipboard();
  const { success } = useToastStore();
  const { t } = useI18n();
  const { clients: mqttClients } = storeToRefs(useMqttStore());
  const { clients: peerClients } = storeToRefs(usePeerStore());
</script>

<template>
  <div class="py-3 px-2 mt-5">
    <div class="flex justify-between">
      <span class="text-3xl font-semibold">{{ t('BROADCAST_TITLE') }}</span>
      <LanguageSwitcher />
    </div>
    <div class="border-t border-orange-500 my-2"></div>
    <div class="flex flex-wrap gap-x-4">
      <!-- Left panel -->
      <div class="flex-1 min-w-60">
        <!-- Stream URL -->
        <fieldset class="fieldset">
          <legend class="fieldset-legend">{{ t('BROADCAST_STREAM_URL') }}</legend>
          <div class="flex">
            <input type="text" class="input w-full" placeholder="Stream URL" disabled :value="streamUrl" />
            <button
              class="ml-2 px-4 py-1 rounded bg-orange-500 hover:bg-orange-400 text-white shadow font-semibold min-w-20 text-sm cursor-pointer"
              @click="
                () => {
                  copy(streamUrl);
                  success(t('TOAST_TITLE_SUCCESS'), t('TOAST_MESSAGE_COPIED_TO_CLIPBOARD'));
                }
              "
              :disabled="!isSupported"
            >
              {{ t('BROADCAST_COPY_BUTTON') }}
            </button>
          </div>
        </fieldset>
        <!-- Webcam and Microphone Selection -->
        <fieldset class="fieldset">
          <legend class="fieldset-legend">{{ t('BROADCAST_INPUT_OPTIONS') }}</legend>
          <div class="mb-2 flex justify-between items-center">
            <label class="flex-1">{{ t('BROADCAST_INPUT_CAMERA') }}:</label>
            <select v-model="selectedVideoDeviceId" class="input flex-5">
              <option v-for="device in videoDevices" :key="device.deviceId" :value="device.deviceId">
                {{ device.label || 'Camera ' + device.deviceId }}
              </option>
            </select>
          </div>
          <div class="mb-2 flex justify-between items-center">
            <label class="flex-1">{{ t('BROADCAST_INPUT_MICROPHONE') }}:</label>
            <select v-model="selectedAudioDeviceId" class="input flex-5">
              <option v-for="device in audioDevices" :key="device.deviceId" :value="device.deviceId">
                {{ device.label || 'Mic ' + device.deviceId }}
              </option>
            </select>
          </div>
        </fieldset>
        <!-- Input Settings -->
        <fieldset class="fieldset">
          <legend class="fieldset-legend">{{ t('BROADCAST_INPUT_SETTINGS') }}</legend>
          <div class="mb-2 flex justify-between items-center">
            <label class="flex-1">{{ t('BROADCAST_INPUT_MIC_TOGGLE') }}:</label>
            <input
              type="checkbox"
              v-model="enableMic"
              class="toggle border-orange-500 bg-white text-orange-500 checked:border-orange-500 checked:bg-orange-500 checked:text-white"
              :disabled="streamSource !== undefined"
            />
          </div>
        </fieldset>
        <!-- Stream Source -->
        <fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">{{ t('BROADCAST_STREAM_SOURCE') }}</legend>
            <div class="flex">
              <div class="join flex w-full">
                <button
                  class="btn join-item flex-1 text-white shadow hover:bg-orange-400 border-0 text-sm"
                  :class="[streamSource === 'screen' ? 'bg-orange-400' : 'bg-orange-500']"
                  @click="() => screenCaptureHandler(selectedAudioDeviceId, enableMic)"
                >
                  {{ t('BROADCAST_SOURCE_SCREEN') }}
                </button>
                <button
                  class="btn join-item flex-1 text-white shadow hover:bg-orange-400 border-0 text-sm"
                  :class="[streamSource === 'camera' ? 'bg-orange-400' : 'bg-orange-500']"
                  @click="() => cameraCaptureHandler(selectedVideoDeviceId, selectedAudioDeviceId, enableMic)"
                >
                  {{ t('BROADCAST_SOURCE_WEBCAM') }}
                </button>
              </div>
              <button
                class="ml-2 rounded-md px-4 py-1 shadow bg-orange-500 hover:bg-orange-400 cursor-pointer"
                @click="resetStreamSource"
              >
                <FontAwesomeIcon icon="circle-xmark" class="text-white text-sm" />
              </button>
            </div>
          </fieldset>
        </fieldset>
        <!-- Stream control -->
        <fieldset class="fieldset">
          <legend class="fieldset-legend">{{ t('BROADCAST_STREAM_CONTROL') }}</legend>
          <div class="flex gap-x-2">
            <button
              class="btn flex-1 bg-green-500 text-white border-0 shadow hover:bg-green-400"
              :class="{
                'opacity-50 cursor-not-allowed':
                  mqttClients[clientId]?.status === false ||
                  peerClients[clientId]?.status === false ||
                  streamStatus === 'live' ||
                  streamMixedContent === null,
              }"
              :disabled="
                mqttClients[clientId]?.status === false ||
                peerClients[clientId]?.status === false ||
                streamStatus === 'live' ||
                streamMixedContent === null
              "
              @click="startLiveStream"
            >
              {{ t('BROADCAST_STREAM_START_LIVE') }}
            </button>
            <button
              class="btn flex-1 bg-red-500 text-white border-0 shadow hover:bg-red-400"
              :class="{
                'opacity-50 cursor-not-allowed':
                  mqttClients[clientId]?.status === false ||
                  peerClients[clientId]?.status === false ||
                  streamStatus !== 'live' ||
                  streamMixedContent === null,
              }"
              :disabled="
                mqttClients[clientId]?.status === false ||
                peerClients[clientId]?.status === false ||
                streamStatus !== 'live' ||
                streamMixedContent === null
              "
              @click="stopLiveStream"
            >
              {{ t('BROADCAST_STREAM_STOP_LIVE') }}
            </button>
          </div>
        </fieldset>
      </div>
      <!-- Right panel -->
      <div class="flex-1 min-w-60">
        <!-- Preview -->
        <fieldset class="fieldset">
          <legend class="fieldset-legend">{{ t('BROADCAST_PREVIEW') }}</legend>
          <Player :mediaStream="streamMixedContent" :status="streamStatus" :autoplay="false" />
        </fieldset>
        <!-- Audio Mixer -->
        <fieldset class="fieldset">
          <legend class="fieldset-legend">{{ t('BROADCAST_AUDIO_MIXER') }}</legend>
          <div v-if="!streamContent || !streamContent.getAudioTracks().length">
            <!-- No audio tracks available -->
            <span class="text-gray-500">{{ t('BROADCAST_NO_AUDIO_TRACKS') }}</span>
          </div>
          <div v-if="streamContent && streamContent.getAudioTracks().length">
            <div v-for="(track, idx) in streamContent.getAudioTracks()" :key="track.id" class="flex items-center mb-2">
              <!-- Track -->
              <span class="mr-2 flex-1">{{ t('BROADCAST_TRACK') }} {{ idx + 1 }}</span>
              <!-- Volume control -->
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                :value="audioVolumes[idx]"
                @input="setTrackVolume(idx, Number(($event.target as HTMLInputElement).value))"
                class="cursor-pointer accent-orange-500 hover:accent-orange-400 drop-shadow flex-1 h-1.5"
              />
              <!-- Volume meter -->
              <div class="ml-2 flex-7 h-2 bg-gray-300 rounded overflow-hidden">
                <div
                  class="h-full transition-all"
                  :class="[
                    (audioLevels[idx] ?? 0) > 0.7
                      ? 'bg-red-500'
                      : (audioLevels[idx] ?? 0) > 0.4
                        ? 'bg-yellow-400'
                        : 'bg-green-500',
                  ]"
                  :style="{ width: Math.min(100, Math.round((audioLevels[idx] ?? 0) * 100)) + '%' }"
                ></div>
              </div>
            </div>
          </div>
        </fieldset>
      </div>
    </div>
  </div>
</template>
