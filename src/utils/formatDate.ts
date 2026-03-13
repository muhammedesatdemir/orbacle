import { Language } from '../types/language';

export function formatDate(timestamp: number, language: Language): string {
  const date = new Date(timestamp);
  const locale = language === 'tr' ? 'tr-TR' : 'en-US';

  return date.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
