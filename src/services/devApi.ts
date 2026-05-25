import { Platform } from 'react-native';
import { API_BASE_URL, API_PATHS, APP_VERSION, ENABLE_DEV_PREMIUM_SYNC } from './config';
import { apiPost } from './apiClient';
import { getInstallId } from './installId';
import type { EntitlementsResponse } from '../api/contract';

// Development-only helpers that hit the backend's /v1/dev/* endpoints to sync
// mock premium/entitlement state for testing. NOT a payment path — RevenueCat
// lands in Phase 6. The backend endpoints are gated to ENVIRONMENT==='development'
// and return 404 in production, so these never grant premium in a real build.

// Whether dev premium sync is usable: the flag is on and a backend exists.
export function devPremiumSyncAvailable(): boolean {
  return ENABLE_DEV_PREMIUM_SYNC && !!API_BASE_URL;
}

async function devPost(path: string): Promise<EntitlementsResponse> {
  const installId = await getInstallId();
  return apiPost<EntitlementsResponse>(
    path,
    { installId, platform: Platform.OS, appVersion: APP_VERSION },
    {},
  );
}

// Grants mock premium on the backend and returns the fresh entitlements snapshot
// (premium=true, kahin.limit=30, deep.limit=3). Throws on network/backend error.
export function devGrantPremium(): Promise<EntitlementsResponse> {
  return devPost(API_PATHS.devGrantPremium);
}

export function devRevokePremium(): Promise<EntitlementsResponse> {
  return devPost(API_PATHS.devRevokePremium);
}

export function devResetUser(): Promise<EntitlementsResponse> {
  return devPost(API_PATHS.devResetUser);
}
