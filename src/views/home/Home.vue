<script setup lang="ts">
  import { ref } from 'vue';

  import { useI18n } from 'vue-i18n';

  import { useHome } from './composables/useHome';

  const roomId = ref<string>('');
  const { redirectToRoom, redirectToBroadcast } = useHome();
  const { t } = useI18n();
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-screen space-y-4">
    <h1 class="text-center lg:text-5xl 3xs:text-4xl font-bold my-3">LIVE @ CHNWT</h1>
    <input
      type="text"
      :placeholder="t('HOME_ENTER_ROOM_ID_PLACEHOLDER')"
      class="my-3 input input-bordered w-full max-w-xs text-center font-sans text-lg"
      v-model="roomId"
    />
    <div class="flex space-x-2 my-3">
      <button
        class="btn bg-orange-500 hover:bg-orange-600 rounded-full text-white text-base py-6 px-5"
        @click="redirectToRoom(roomId)"
      >
        {{ t('HOME_CONNECT_BUTTON') }}
      </button>
      <button
        class="btn bg-red-500 hover:bg-red-600 rounded-full text-white text-base py-6 px-5"
        @click="redirectToBroadcast"
      >
        {{ t('HOME_BROADCAST') }}
      </button>
    </div>
  </div>
</template>
