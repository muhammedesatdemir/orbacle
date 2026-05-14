import AsyncStorage from '@react-native-async-storage/async-storage';
import { HistoryItem } from '../types/history';
import { StorageKeys } from './keys';

const HISTORY_KEY = StorageKeys.history;
const MAX_ITEMS = 50;

function isValidItem(x: unknown): x is HistoryItem {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.id === 'string' &&
    typeof o.question === 'string' &&
    typeof o.answer === 'string' &&
    typeof o.timestamp === 'number' &&
    (o.language === 'en' || o.language === 'tr')
  );
}

export async function getHistory(): Promise<HistoryItem[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      await AsyncStorage.removeItem(HISTORY_KEY).catch(() => {});
      return [];
    }
    const clean = parsed.filter(isValidItem);
    if (clean.length !== parsed.length) {
      // Drop corrupted entries silently.
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(clean)).catch(() => {});
    }
    return clean;
  } catch {
    await AsyncStorage.removeItem(HISTORY_KEY).catch(() => {});
    return [];
  }
}

export async function addHistoryItem(item: HistoryItem): Promise<void> {
  try {
    const history = await getHistory();
    history.unshift(item);
    const trimmed = history.slice(0, MAX_ITEMS);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
  } catch {
    // Disk full or write error — degrade silently rather than crash.
  }
}

export async function clearHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(HISTORY_KEY);
  } catch {
    // ignore
  }
}
