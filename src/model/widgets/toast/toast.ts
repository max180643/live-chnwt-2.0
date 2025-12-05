import type { Ref } from 'vue';

import type { ToastType } from '@/types/widgets/toast/toast';

interface Toast {
  /* Currently active toast notifications */
  toasts: Ref<ToastItem[]>;

  /* Removes a toast notification by its ID */
  removeToast: (id: string) => void;
}

interface ToastItem {
  /* Unique identifier */
  id: string;

  /* Ttile */
  title: string;

  /* Text content */
  message: string;

  /* Visual style category */
  type: ToastType;

  /* Display duration in milliseconds */
  duration: number;

  /* Creation timestamp */
  timestamp: number;
}

interface ToastOptions {
  /* Display duration in milliseconds */
  duration?: number;
}

export type { Toast, ToastItem, ToastOptions };
