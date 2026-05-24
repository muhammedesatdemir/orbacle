// Small crypto helpers built on the Workers WebCrypto runtime.

// RFC4122 v4 UUID. Used for reading_id / report_id.
export function uuid(): string {
  return crypto.randomUUID();
}

// Constant-time string comparison (used by the RevenueCat webhook signature
// check in Phase 6 — defined now so the wiring is ready). Returns false on
// length mismatch without early-exit timing leaks.
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
