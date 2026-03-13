import AsyncStorage from '@react-native-async-storage/async-storage';
import { HistoryItem } from '../types/history';

const HISTORY_KEY = '@orbacle_history';
const MAX_ITEMS = 20;

export async function getHistory(): Promise<HistoryItem[]> {
  const raw = await AsyncStorage.getItem(HISTORY_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as HistoryItem[];
  } catch {
    return [];
  }
}

export async function addHistoryItem(item: HistoryItem): Promise<void> {
  const history = await getHistory();
  history.unshift(item);
  const trimmed = history.slice(0, MAX_ITEMS);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
}

export async function clearHistory(): Promise<void> {
  await AsyncStorage.removeItem(HISTORY_KEY);
}
