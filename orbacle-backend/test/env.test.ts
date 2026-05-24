import { describe, it, expect } from 'vitest';
import { parseEnvBoolean } from '../src/lib/env';

describe('parseEnvBoolean', () => {
  it('parses string "false"/"true"', () => {
    expect(parseEnvBoolean('false', true)).toBe(false);
    expect(parseEnvBoolean('true', false)).toBe(true);
  });
  it('parses "0"/"1"', () => {
    expect(parseEnvBoolean('0', true)).toBe(false);
    expect(parseEnvBoolean('1', false)).toBe(true);
  });
  it('parses "no"/"yes" and is case/space-insensitive', () => {
    expect(parseEnvBoolean(' NO ', true)).toBe(false);
    expect(parseEnvBoolean('Yes', false)).toBe(true);
    expect(parseEnvBoolean('FALSE', true)).toBe(false);
  });
  it('passes through real booleans', () => {
    expect(parseEnvBoolean(false, true)).toBe(false);
    expect(parseEnvBoolean(true, false)).toBe(true);
  });
  it('uses the fallback for undefined/null/empty/unknown', () => {
    expect(parseEnvBoolean(undefined, true)).toBe(true);
    expect(parseEnvBoolean(undefined, false)).toBe(false);
    expect(parseEnvBoolean(null, true)).toBe(true);
    expect(parseEnvBoolean('', false)).toBe(false);
    expect(parseEnvBoolean('maybe', true)).toBe(true);
  });
});
