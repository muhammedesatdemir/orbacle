import AsyncStorage from '@react-native-async-storage/async-storage';
import { FavoriteItem } from '../types/favorite';
import { isSupportedLanguage } from '../types/language';
import { StorageKeys } from './keys';

const FAVORITES_KEY = StorageKeys.favorites;
const MAX_ITEMS = 100;

function isValidItem(x: unknown): x is FavoriteItem {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.id === 'string' &&
    typeof o.question === 'string' &&
    typeof o.answer === 'string' &&
    typeof o.timestamp === 'number' &&
    isSupportedLanguage(o.language)
  );
}

export async function getFavorites(): Promise<FavoriteItem[]> {
  try {
    const raw = await AsyncStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      await AsyncStorage.removeItem(FAVORITES_KEY).catch(() => {});
      return [];
    }
    const clean = parsed.filter(isValidItem);
    if (clean.length !== parsed.length) {
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(clean)).catch(() => {});
    }
    return clean;
  } catch {
    await AsyncStorage.removeItem(FAVORITES_KEY).catch(() => {});
    return [];
  }
}

export async function isFavorite(id: string): Promise<boolean> {
  const favorites = await getFavorites();
  return favorites.some((f) => f.id === id);
}

export async function addFavorite(item: FavoriteItem): Promise<void> {
  try {
    const favorites = await getFavorites();
    if (favorites.some((f) => f.id === item.id)) return;
    favorites.unshift(item);
    const trimmed = favorites.slice(0, MAX_ITEMS);
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(trimmed));
  } catch {
    // Disk full or write error — degrade silently rather than crash.
  }
}

export async function removeFavorite(id: string): Promise<void> {
  try {
    const favorites = await getFavorites();
    const next = favorites.filter((f) => f.id !== id);
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

// Returns the favorite state after the toggle (true = now favorited).
export async function toggleFavorite(item: FavoriteItem): Promise<boolean> {
  const favorited = await isFavorite(item.id);
  if (favorited) {
    await removeFavorite(item.id);
    return false;
  }
  await addFavorite(item);
  return true;
}
