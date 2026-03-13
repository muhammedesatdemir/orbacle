import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language } from '../types/language';

const LANGUAGE_KEY = '@orbacle_language';
const HAPTICS_KEY = '@orbacle_haptics';

export async function getSavedLanguage(): Promise<Language | null> {
  const val = await AsyncStorage.getItem(LANGUAGE_KEY);
  if (val === 'tr' || val === 'en') return val;
  return null;
}

export async function saveLanguage(language: Language): Promise<void> {
  await AsyncStorage.setItem(LANGUAGE_KEY, language);
}

export async function getHapticsEnabled(): Promise<boolean> {
  const val = await AsyncStorage.getItem(HAPTICS_KEY);
  return val !== 'false'; // enabled by default
}

export async function saveHapticsEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(HAPTICS_KEY, String(enabled));
}
