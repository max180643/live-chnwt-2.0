import { storeToRefs } from 'pinia';

import type { Toast } from '@/model/widgets/toast/toast';

import { useToastStore } from '../../../stores/useToastStore';

function useToast(): Toast {
  const toast = useToastStore();
  const { activeToasts } = storeToRefs(toast);
  const { removeToast } = toast;

  return {
    /* Currently active toast notifications */
    toasts: activeToasts,

    /* Removes a toast notification by its ID */
    removeToast,
  };
}

export { useToast };
