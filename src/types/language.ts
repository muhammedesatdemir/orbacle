export type Language =
  | 'tr'
  | 'en'
  | 'es-LA'
  | 'pt-BR'
  | 'hi-IN'
  | 'id-ID'
  | 'ar'
  | 'de-DE'
  | 'fr-FR'
  | 'ja-JP';

export interface LanguageDescriptor {
  code: Language;
  nativeName: string;
  rtl: boolean;
}

// Order = display order in the picker. Keep stable: users learn to find their
// language by position. Native names so users always see something they recognise
// even if the app is currently in a language they don't read.
export const supportedLanguages: readonly LanguageDescriptor[] = [
  { code: 'tr',    nativeName: 'Türkçe',              rtl: false },
  { code: 'en',    nativeName: 'English',             rtl: false },
  { code: 'es-LA', nativeName: 'Español',             rtl: false },
  { code: 'pt-BR', nativeName: 'Português (Brasil)',  rtl: false },
  { code: 'hi-IN', nativeName: 'हिन्दी',                rtl: false },
  { code: 'id-ID', nativeName: 'Bahasa Indonesia',    rtl: false },
  { code: 'ar',    nativeName: 'العربية',              rtl: true  },
  { code: 'de-DE', nativeName: 'Deutsch',             rtl: false },
  { code: 'fr-FR', nativeName: 'Français',            rtl: false },
  { code: 'ja-JP', nativeName: '日本語',                rtl: false },
] as const;

export const FALLBACK_LANGUAGE: Language = 'en';

const codeSet = new Set<string>(supportedLanguages.map((l) => l.code));

export function isSupportedLanguage(value: unknown): value is Language {
  return typeof value === 'string' && codeSet.has(value);
}
