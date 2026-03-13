import { Platform, NativeModules } from 'react-native';
import { Language } from '../types/language';

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

  const lang = locale.toLowerCase().substring(0, 2);
  return lang === 'tr' ? 'tr' : 'en';
}
