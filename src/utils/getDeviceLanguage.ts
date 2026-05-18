import { Platform, NativeModules } from 'react-native';
import { Language, FALLBACK_LANGUAGE } from '../types/language';

// Maps the device's two-letter language code (and a few region hints) to one
// of our supported app languages. Unknown languages fall back to English.
function mapLocaleToLanguage(locale: string): Language {
  const lower = locale.toLowerCase().replace('_', '-');
  const lang = lower.substring(0, 2);
  const region = lower.split('-')[1]?.substring(0, 2) ?? '';

  switch (lang) {
    case 'tr':
      return 'tr';
    case 'en':
      return 'en';
    case 'es':
      return 'es-LA';
    case 'pt':
      // Brazil pool was tuned for Brazilian Portuguese; route pt-PT users
      // there too rather than dropping them to English.
      return 'pt-BR';
    case 'hi':
      return 'hi-IN';
    case 'id':
    case 'ms':
      // ms (Malay) is close enough to Indonesian for a first-launch default;
      // the user can switch in Settings.
      return 'id-ID';
    case 'ar':
      return 'ar';
    case 'de':
      return 'de-DE';
    case 'fr':
      return 'fr-FR';
    case 'ja':
      return 'ja-JP';
    default:
      // Unused for now, but keeps the region read used so a future per-region
      // override (e.g. es-ES → es-LA) has a place to land.
      void region;
      return FALLBACK_LANGUAGE;
  }
}

export function getDeviceLanguage(): Language {
  let locale = 'en';

  if (Platform.OS === 'ios') {
    locale =
      NativeModules.SettingsManager?.settings?.AppleLocale ??
      NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] ??
      'en';
  } else {
    locale = NativeModules.I18nManager?.localeIdentifier ?? 'en';
  }

  return mapLocaleToLanguage(locale);
}
