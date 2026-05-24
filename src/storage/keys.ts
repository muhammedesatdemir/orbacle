// Central registry of AsyncStorage keys. Keep all key strings here so the
// full set of persisted data is visible in one place.
export const StorageKeys = {
  language: '@orbacle_language',
  haptics: '@orbacle_haptics',
  onboarded: '@orbacle_onboarded',
  history: '@orbacle_history',
  favorites: '@orbacle_favorites',
  entitlements: '@orbacle_entitlements',
  installId: '@orbacle_install_id',
} as const;
