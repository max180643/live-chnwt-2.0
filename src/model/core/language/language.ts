import type { Ref } from 'vue';

interface Language {
  currentLanguage: Ref<string>;
  toggleLanguage: () => void;
}

export type { Language };
