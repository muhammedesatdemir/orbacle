import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language, isSupportedLanguage } from '../types/language';
import { StorageKeys } from './keys';

const LANGUAGE_KEY = StorageKeys.language;
const HAPTICS_KEY = StorageKeys.haptics;
const ONBOARDED_KEY = StorageKeys.onboarded;

export async function getSavedLanguage(): Promise<Language | null> {
  try {
    const val = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (isSupportedLanguage(val)) return val;
    return null;
  } catch {
    return null;
  }
}

export async function saveLanguage(language: Language): Promise<void> {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, language);
  } catch {
    // ignore — next launch will re-detect device language
  }
}

export async function getHapticsEnabled(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(HAPTICS_KEY);
    return val !== 'false'; // enabled by default
  } catch {
    return true;
  }
}

export async function saveHapticsEnabled(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(HAPTICS_KEY, String(enabled));
  } catch {
    // ignore
  }
}

export async function getOnboarded(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(ONBOARDED_KEY);
    return val === 'true';
  } catch {
    // On read failure, treat as onboarded — never trap the user in onboarding.
    return true;
  }
}

export async function saveOnboarded(): Promise<void> {
  try {
    await AsyncStorage.setItem(ONBOARDED_KEY, 'true');
  } catch {
    // ignore — onboarding will show again next launch, acceptable degradation
  }
}
