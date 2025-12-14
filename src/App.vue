<script setup lang="ts">
  import Toast from '@/components/widgets/toast/Toast.vue';
</script>

<template>
  <div>
    <div class="container mx-auto">
      <router-view />
      <Toast />
    </div>
  </div>
</template>

<style scoped></style>
