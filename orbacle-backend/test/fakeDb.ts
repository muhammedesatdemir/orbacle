import type { EntitlementRow, DailyUsageRow, UserRow } from '../src/types/db';

// Minimal in-memory stand-in for the D1 bindings used by entitlementService.
// It does NOT parse SQL generically — it recognizes the specific statements the
// service issues (matched by substring) and mutates the in-memory tables with
// the same conditional semantics (WHERE count < limit, changes() count). This
// lets us unit-test the consume/quota FLOW without a real SQLite engine.
export interface Tables {
  users: Map<string, UserRow>;
  entitlements: Map<string, EntitlementRow>;
  dailyUsage: Map<string, DailyUsageRow>; // key: `${user}:${date}`
}

export function newTables(): Tables {
  return { users: new Map(), entitlements: new Map(), dailyUsage: new Map() };
}

function du(tables: Tables, user: string, date: string): DailyUsageRow {
  const key = `${user}:${date}`;
  let row = tables.dailyUsage.get(key);
  if (!row) {
    row = { user_id: user, usage_date: date, kahin_count: 0, deep_count: 0, rewarded_kahin: 0 };
  }
  return row;
}

interface Prepared {
  bind: (...args: unknown[]) => Prepared;
  run: () => Promise<{ meta: { changes: number } }>;
  first: <T>() => Promise<T | null>;
}

export function makeFakeD1(tables: Tables): D1Database {
  function prepare(sql: string): Prepared {
    let args: unknown[] = [];
    const api: Prepared = {
      bind(...a: unknown[]) {
        args = a;
        return api;
      },
      async run() {
        let changes = 0;
        const s = sql.replace(/\s+/g, ' ');

        if (s.includes('INSERT INTO users')) {
          const [id, platform, locale, ts] = args as [string, string, string, number];
          const existing = tables.users.get(id);
          tables.users.set(id, {
            id,
            platform,
            locale,
            created_at: existing?.created_at ?? ts,
            last_seen_at: ts,
            rc_app_user_id: existing?.rc_app_user_id ?? null,
          });
          changes = 1;
        } else if (s.includes('INSERT INTO entitlements') && s.includes('DO NOTHING')) {
          const [userId, ts] = args as [string, number];
          if (!tables.entitlements.has(userId)) {
            tables.entitlements.set(userId, {
              user_id: userId,
              premium_active: 0,
              premium_expires_at: null,
              premium_product: null,
              deep_pack_balance: 0,
              first_deep_used: 0,
              updated_at: ts,
            });
            changes = 1;
          }
        } else if (s.includes('INSERT INTO daily_usage') && s.includes('kahin_count')) {
          // INSERT ... VALUES(...,1) ON CONFLICT DO UPDATE kahin_count+1 WHERE kahin_count < ?3
          const [userId, date] = args as [string, string];
          const limit = (args[2] as number | undefined) ?? Infinity;
          const key = `${userId}:${date}`;
          const existing = tables.dailyUsage.get(key);
          if (!existing) {
            tables.dailyUsage.set(key, { ...du(tables, userId, date), kahin_count: 1 });
            changes = 1;
          } else if (existing.kahin_count < limit) {
            existing.kahin_count += 1;
            changes = 1;
          }
        } else if (s.includes('INSERT INTO daily_usage') && s.includes('deep_count') && s.includes('WHERE deep_count <')) {
          const [userId, date] = args as [string, string];
          const limit = (args[2] as number | undefined) ?? Infinity;
          const key = `${userId}:${date}`;
          const existing = tables.dailyUsage.get(key);
          if (!existing) {
            tables.dailyUsage.set(key, { ...du(tables, userId, date), deep_count: 1 });
            changes = 1;
          } else if (existing.deep_count < limit) {
            existing.deep_count += 1;
            changes = 1;
          }
        } else if (s.includes('INSERT INTO daily_usage') && s.includes('deep_count')) {
          // Unconditional deep_count++ (analytics path)
          const [userId, date] = args as [string, string];
          const key = `${userId}:${date}`;
          const existing = tables.dailyUsage.get(key);
          if (!existing) {
            tables.dailyUsage.set(key, { ...du(tables, userId, date), deep_count: 1 });
          } else {
            existing.deep_count += 1;
          }
          changes = 1;
        } else if (s.includes('UPDATE entitlements SET first_deep_used')) {
          const [userId, ts] = args as [string, number];
          const limit = (args[2] as number | undefined) ?? Infinity;
          const ent = tables.entitlements.get(userId);
          if (ent && ent.first_deep_used < limit) {
            ent.first_deep_used += 1;
            ent.updated_at = ts;
            changes = 1;
          }
        } else if (s.includes('UPDATE entitlements SET deep_pack_balance')) {
          const [userId, ts] = args as [string, number];
          const ent = tables.entitlements.get(userId);
          if (ent && ent.deep_pack_balance > 0) {
            ent.deep_pack_balance -= 1;
            ent.updated_at = ts;
            changes = 1;
          }
        }

        return { meta: { changes } };
      },
      async first<T>() {
        const s = sql.replace(/\s+/g, ' ');
        if (s.includes('FROM entitlements')) {
          return (tables.entitlements.get(args[0] as string) ?? null) as T | null;
        }
        if (s.includes('FROM daily_usage')) {
          const key = `${args[0]}:${args[1]}`;
          return (tables.dailyUsage.get(key) ?? null) as T | null;
        }
        if (s.includes('FROM users')) {
          return (tables.users.get(args[0] as string) ?? null) as T | null;
        }
        return null;
      },
    };
    return api;
  }

  // Only the methods entitlementService uses are implemented.
  return { prepare } as unknown as D1Database;
}
