<script setup lang="ts">
  import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

  import { useLanguage } from '@/composables/core/language/useLanguage';

  const { currentLanguage, toggleLanguage } = useLanguage();
</script>

<template>
  <div class="cursor-pointer border border-orange-500 p-1 rounded-sm hover:bg-orange-500 hover:text-white">
    <button @click="toggleLanguage" class="font-semibold">
      <FontAwesomeIcon icon="language" />
      {{ currentLanguage === 'en' ? ' ไทย' : 'EN' }}
    </button>
  </div>
</template>
