import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageKeys } from '../storage/keys';
import { todayKey } from '../storage/dailyRepository';
import { EntitlementSnapshot, DEFAULT_SNAPSHOT, applyDailyReset } from './types';

// Re-exported for existing importers (provider) that pulled it from here.
export { applyDailyReset };

// Validates a parsed value against the snapshot shape. Anything off → defaults,
// matching the silent-fail convention used across the storage layer.
function isValidSnapshot(value: unknown): value is EntitlementSnapshot {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.isPremium === 'boolean' &&
    typeof v.lastResetKey === 'string' &&
    typeof v.kahinUsedToday === 'number' &&
    typeof v.kahinBonusToday === 'number' &&
    typeof v.deepUsedToday === 'number' &&
    typeof v.deepLifetimeUsed === 'number' &&
    typeof v.deepPackRemaining === 'number'
  );
}

async function persist(snapshot: EntitlementSnapshot): Promise<EntitlementSnapshot> {
  try {
    await AsyncStorage.setItem(StorageKeys.entitlements, JSON.stringify(snapshot));
  } catch {
    // Storage failures must not break the app; the in-memory snapshot still works.
  }
  return snapshot;
}

// Reads the snapshot, applying (and persisting) a lazy daily reset if needed.
// Always resolves to a valid snapshot — never throws.
export async function getSnapshot(): Promise<EntitlementSnapshot> {
  const today = todayKey();
  let raw: EntitlementSnapshot;
  try {
    const json = await AsyncStorage.getItem(StorageKeys.entitlements);
    const parsed: unknown = json ? JSON.parse(json) : null;
    raw = isValidSnapshot(parsed) ? parsed : { ...DEFAULT_SNAPSHOT, lastResetKey: today };
  } catch {
    raw = { ...DEFAULT_SNAPSHOT, lastResetKey: today };
  }

  const reset = applyDailyReset(raw, today);
  // Persist only when something actually changed (first run or day rollover).
  if (reset !== raw || raw.lastResetKey !== today) {
    return persist(reset);
  }
  return reset;
}

// Overwrites the stored snapshot. Used by the provider after consume/grant.
export async function saveSnapshot(snapshot: EntitlementSnapshot): Promise<EntitlementSnapshot> {
  return persist(snapshot);
}
