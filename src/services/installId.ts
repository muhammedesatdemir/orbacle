import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageKeys } from '../storage/keys';

// Anonymous, stable install identifier sent to the backend as X-Install-Id.
// It is NOT a security credential — just a per-install handle for entitlement
// and rate-limit accounting. Persisted in AsyncStorage so it survives app
// restarts; a fresh install (or cleared data) yields a new id.
//
// We generate a UUIDv4 without adding a native crypto dependency. RN/Hermes has
// no global crypto.randomUUID by default, so we use one if present and fall back
// to a Math.random-based v4. Collisions are astronomically unlikely for this use.

let cached: string | null = null;

function randomUuidV4(): string {
  // Prefer a real CSPRNG UUID if the runtime exposes one.
  const g = globalThis as { crypto?: { randomUUID?: () => string } };
  if (g.crypto?.randomUUID) {
    try {
      return g.crypto.randomUUID();
    } catch {
      // fall through to manual generation
    }
  }
  // Manual RFC4122 v4 (non-cryptographic randomness — acceptable for an
  // anonymous install handle).
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Returns the persistent install id, generating and storing one on first use.
// Never throws — on storage failure it returns an in-memory id for this session.
export async function getInstallId(): Promise<string> {
  if (cached) return cached;
  try {
    const existing = await AsyncStorage.getItem(StorageKeys.installId);
    if (existing) {
      cached = existing;
      return existing;
    }
    const id = randomUuidV4();
    await AsyncStorage.setItem(StorageKeys.installId, id);
    cached = id;
    return id;
  } catch {
    // Storage unavailable — use a session-only id so requests still work.
    cached = cached ?? randomUuidV4();
    return cached;
  }
}
