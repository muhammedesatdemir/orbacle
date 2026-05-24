import { describe, it, expect } from 'vitest';
import { prefilter, safeMessageFor } from '../src/services/safetyService';

describe('safety prefilter', () => {
  it('catches a self-harm phrase (en)', () => {
    const r = prefilter('I want to die, what should I do?');
    expect(r.blocked).toBe(true);
    expect(r.flag).toBe('self_harm');
  });

  it('catches a self-harm phrase (tr)', () => {
    const r = prefilter('intihar etmeli miyim?');
    expect(r.blocked).toBe(true);
    expect(r.flag).toBe('self_harm');
  });

  it('catches a self-harm phrase (ja)', () => {
    const r = prefilter('死にたい');
    expect(r.blocked).toBe(true);
    expect(r.flag).toBe('self_harm');
  });

  it('self_harm wins ordering over other classes', () => {
    const r = prefilter('I want to die and sue everyone');
    expect(r.flag).toBe('self_harm');
  });

  it('does not block an ordinary love question', () => {
    const r = prefilter('Should I text my crush again?', 'A waiting heart sees clearer.');
    expect(r.blocked).toBe(false);
    expect(r.flag).toBeUndefined();
  });

  it('safeMessageFor returns a localized message and falls back to en', () => {
    expect(safeMessageFor('tr')).toContain('uzman');
    expect(safeMessageFor('en')).toContain('professional');
    // @ts-expect-error testing fallback with an unknown locale
    expect(safeMessageFor('zz')).toBe(safeMessageFor('en'));
  });
});
