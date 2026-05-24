import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { todayKey } from '../storage/dailyRepository';
import {
  EntitlementSnapshot,
  DEFAULT_SNAPSHOT,
  TierAllowance,
  TierKey,
  ConsumeResult,
  applyQuota,
} from './types';
import { getSnapshot, saveSnapshot, applyDailyReset } from './entitlementStorage';
import { computeAllowances, applyConsume } from './mockEntitlements';
import type { QuotaSnapshot } from '../api/contract';

interface EntitlementContextValue {
  ready: boolean;
  isPremium: boolean;
  allowances: Record<TierKey, TierAllowance>;
  // Attempts to consume one use of a tier; persists and updates state on success.
  consume: (tier: TierKey) => Promise<ConsumeResult>;
  // Mock-only: flips the local premium flag (placeholder paywall CTA).
  setPremiumMock: (value: boolean) => Promise<void>;
  // Backend is the source of truth (Phase 4): mirror the server quota snapshot
  // returned by a reading into local state so the UI counters stay in sync.
  syncFromQuota: (quota: QuotaSnapshot) => Promise<void>;
  // Re-reads from storage (applies any pending daily reset).
  refresh: () => Promise<void>;
}

const initialAllowances = computeAllowances(DEFAULT_SNAPSHOT);

const EntitlementContext = createContext<EntitlementContextValue>({
  ready: false,
  isPremium: false,
  allowances: initialAllowances,
  consume: async () => ({ ok: false, reason: 'limit' }),
  setPremiumMock: async () => {},
  syncFromQuota: async () => {},
  refresh: async () => {},
});

export const useEntitlementContext = () => React.useContext(EntitlementContext);

export const EntitlementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [snapshot, setSnapshot] = useState<EntitlementSnapshot>(DEFAULT_SNAPSHOT);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getSnapshot()
      .then(setSnapshot)
      .finally(() => setReady(true));
  }, []);

  const refresh = useCallback(async () => {
    const next = await getSnapshot();
    setSnapshot(next);
  }, []);

  const consume = useCallback(async (tier: TierKey): Promise<ConsumeResult> => {
    // Re-derive from the freshest snapshot, applying a daily reset first so a
    // day rollover between app open and tap doesn't grant stale uses.
    const current = applyDailyReset(snapshot, todayKey());
    const allowance = computeAllowances(current)[tier];
    if (!allowance.canUse) {
      // Persist the reset (if any) even on failure so counters stay correct.
      if (current !== snapshot) {
        setSnapshot(current);
        await saveSnapshot(current);
      }
      return { ok: false, reason: current.isPremium ? 'limit' : 'needsPremium' };
    }
    const next = applyConsume(current, tier);
    setSnapshot(next);
    await saveSnapshot(next);
    return { ok: true };
  }, [snapshot]);

  const setPremiumMock = useCallback(async (value: boolean) => {
    const next = { ...snapshot, isPremium: value };
    setSnapshot(next);
    await saveSnapshot(next);
  }, [snapshot]);

  const syncFromQuota = useCallback(async (quota: QuotaSnapshot) => {
    const next = applyQuota(snapshot, quota, todayKey());
    setSnapshot(next);
    await saveSnapshot(next);
  }, [snapshot]);

  const allowances = useMemo(() => computeAllowances(snapshot), [snapshot]);

  const value = useMemo<EntitlementContextValue>(
    () => ({ ready, isPremium: snapshot.isPremium, allowances, consume, setPremiumMock, syncFromQuota, refresh }),
    [ready, snapshot.isPremium, allowances, consume, setPremiumMock, syncFromQuota, refresh],
  );

  return React.createElement(EntitlementContext.Provider, { value }, children);
};
