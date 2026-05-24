import { useEntitlementContext } from './entitlementProvider';

// Thin accessor for the entitlement context, mirroring useI18n's shape.
export const useEntitlements = () => useEntitlementContext();
