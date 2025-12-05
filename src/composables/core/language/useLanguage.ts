import { ref } from 'vue';

import { useI18n } from 'vue-i18n';

import type { Language } from '@/model/core/language/language';

function useLanguage(): Language {
  const { locale } = useI18n();
  const currentLanguage = ref(locale.value);

  const toggleLanguage = () => {
    currentLanguage.value = currentLanguage.value === 'en' ? 'th' : 'en';
    locale.value = currentLanguage.value;
  };

  return {
    currentLanguage,
    toggleLanguage,
  };
}

export { useLanguage };
