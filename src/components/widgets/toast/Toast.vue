<script setup lang="ts">
  import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

  import { useToast } from '@/composables/widgets/toast/useToast';

  const { toasts, removeToast } = useToast();
</script>

<template>
  <div class="toast toast-top toast-end z-50">
    <TransitionGroup name="toast">
      <div v-for="toast in toasts" :key="toast.id" class="toast-item max-w-xs min-w-xs">
        <div
          class="alert relative border shadow-sm"
          :class="[
            toast.type === 'info' ? 'bg-base-100 border-2 border-blue-500/50' : '',
            toast.type === 'success' ? 'bg-base-100 border-2 border-green-500/50' : '',
            toast.type === 'warning' ? 'bg-base-100 border-2 border-amber-500/50' : '',
            toast.type === 'error' ? 'bg-base-100 border-2 border-red-500/50' : '',
          ]"
        >
          <div class="flex min-w-0 items-center gap-2">
            <div v-if="toast.type === 'info'" class="shrink-0">
              <FontAwesomeIcon icon="info-circle" class="text-xl text-blue-500" />
            </div>
            <div v-else-if="toast.type === 'success'" class="shrink-0">
              <FontAwesomeIcon icon="check-circle" class="text-xl text-green-500" />
            </div>
            <div v-else-if="toast.type === 'warning'" class="shrink-0">
              <FontAwesomeIcon icon="exclamation-triangle" class="text-xl text-amber-500" />
            </div>
            <div v-else-if="toast.type === 'error'" class="shrink-0">
              <FontAwesomeIcon icon="circle-exclamation" class="text-xl text-red-500" />
            </div>
            <div class="flex min-w-0 flex-col gap-y-1">
              <span class="font-bold text-wrap">{{ toast.title }}</span>
              <span class="font-medium text-wrap">{{ toast.message }}</span>
            </div>
          </div>
          <button
            @click="removeToast(toast.id)"
            class="btn btn-ghost btn-xs absolute top-1 right-1 text-gray-500 hover:text-black"
          >
            <FontAwesomeIcon icon="times" />
          </button>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>
