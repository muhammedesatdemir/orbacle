// Parses an env var (which Workers always delivers as a string) into a boolean.
// Cloudflare passes [vars]/.dev.vars values as strings, so a plain
// `Boolean(env.X)` or `env.X || cfg.default` treats "false" as truthy. Use this
// instead. Returns `fallback` for undefined/null/empty/unrecognized values.
export function parseEnvBoolean(value: unknown, fallback: boolean): boolean {
  if (value === true) return true;
  if (value === false) return false;
  if (typeof value !== 'string') return fallback;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === 'yes') return true;
  if (normalized === 'false' || normalized === '0' || normalized === 'no') return false;
  return fallback;
}
