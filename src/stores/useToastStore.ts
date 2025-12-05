import { computed, ref } from 'vue';

import { DateTime } from 'luxon';
import { nanoid } from 'nanoid';
import { defineStore } from 'pinia';

import type { ToastItem, ToastOptions } from '@/model/widgets/toast/toast';
import type { ToastType } from '@/types/widgets/toast/toast';

const useToastStore = defineStore('toast', () => {
  /* List of active toast notifications */
  const toasts = ref<ToastItem[]>([]);

  /* Maximum number of concurrent toasts */
  const maxToasts = 5;

  /* Default durations for different toast types in milliseconds */
  const defaultDurations: Record<ToastType, number> = {
    success: 3000,
    info: 4000,
    warning: 5000,
    error: 6000,
  };

  /* Create a toast notification with the specified type */
  function createToast(message: string, title: string, type: ToastType, options?: ToastOptions): string {
    /* Use provided duration or fall back to default for the toast type */
    const duration = options?.duration ?? defaultDurations[type];

    /* Generate a unique ID and toast object */
    const id = generateToastId();
    const toast: ToastItem = {
      id,
      title,
      message,
      type,
      duration,
      timestamp: DateTime.now().toMillis(),
    };

    /* Add the new toast to the beginning of the list */
    toasts.value = [toast, ...toasts.value].slice(0, maxToasts);

    /* Auto-remove the toast after its duration */
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }

  /* Remove a toast notification by its ID */
  function removeToast(id: string): void {
    toasts.value = toasts.value.filter((toast) => toast.id !== id);
  }

  /* Clear all active toast notification */
  function clearToasts(): void {
    toasts.value = [];
  }

  /* Add an information toast notification */
  function info(title: string, message: string, options?: ToastOptions): string {
    return createToast(message, title, 'info', options);
  }

  /* Add a success toast notification */
  function success(title: string, message: string, options?: ToastOptions): string {
    return createToast(message, title, 'success', options);
  }

  /* Add a warning toast notification */
  function warning(title: string, message: string, options?: ToastOptions): string {
    return createToast(message, title, 'warning', options);
  }

  /* Add an error toast notification */
  function error(title: string, message: string, options?: ToastOptions): string {
    return createToast(message, title, 'error', options);
  }

  /* List of currently active toasts */
  const activeToasts = computed(() => toasts.value);

  return {
    toasts,
    activeToasts,
    createToast,
    removeToast,
    clearToasts,
    info,
    success,
    warning,
    error,
  };
});

const generateToastId = (): string => {
  return `toast-${DateTime.now().toFormat('yyyyMMdd')}-${nanoid(8)}`;
};

export { useToastStore };
