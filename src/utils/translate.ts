import { i18n } from '@/i18n';
import type { MessageSchema } from '@/i18n';

function translate(key: keyof MessageSchema): string {
  return i18n.global.t(key) as string;
}

export { translate };
