import { createI18n } from 'vue-i18n';

import en from '@/locales/en.json';
import th from '@/locales/th.json';

export const i18n = createI18n({
  locale: 'en',
  fallbackLng: 'en',
  messages: {
    en,
    th,
  },
});

export type MessageSchema = typeof i18n.global.messages.en;
