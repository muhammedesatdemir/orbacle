import { Language } from '../types/language';

const LOCALE_MAP: Record<Language, string> = {
  tr: 'tr-TR',
  en: 'en-US',
  'es-LA': 'es-MX',
  'pt-BR': 'pt-BR',
  'hi-IN': 'hi-IN',
  'id-ID': 'id-ID',
  ar: 'ar',
  'de-DE': 'de-DE',
  'fr-FR': 'fr-FR',
  'ja-JP': 'ja-JP',
};

export function formatDate(timestamp: number, language: Language): string {
  const date = new Date(timestamp);
  const locale = LOCALE_MAP[language] ?? 'en-US';

  return date.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
