import { describe, it, expect } from 'vitest';
import { DEFAULT_CONFIG, toConfigResponse, disclaimerFor } from '../src/services/configService';
import seed from '../seed/config_v1.json';

describe('config', () => {
  it('config_v1.json parses and matches DEFAULT_CONFIG values', () => {
    expect(seed.freeKahinDailyLimit).toBe(DEFAULT_CONFIG.freeKahinDailyLimit);
    expect(seed.premiumKahinDailyLimit).toBe(DEFAULT_CONFIG.premiumKahinDailyLimit);
    expect(seed.premiumDeepDailyLimit).toBe(DEFAULT_CONFIG.premiumDeepDailyLimit);
    expect(seed.deepTrialLifetime).toBe(DEFAULT_CONFIG.deepTrialLifetime);
    expect(seed.useMockLLM).toBe(true);
    expect(seed.activePromptVersions.kahin).toBe(DEFAULT_CONFIG.activePromptVersions.kahin);
    expect(seed.activePromptVersions.deep).toBe(DEFAULT_CONFIG.activePromptVersions.deep);
  });

  it('toConfigResponse exposes the public subset with a localized disclaimer', () => {
    const res = toConfigResponse(DEFAULT_CONFIG, 'tr');
    expect(res.ok).toBe(true);
    expect(res.limits.premium_kahin_daily).toBe(30);
    expect(res.limits.premium_deep_daily).toBe(3);
    expect(res.feature_flags.deep_enabled).toBe(true);
    expect(res.prompt_versions.kahin).toBe('prompt_kahin_v1');
    expect(res.disclaimer).toBe(disclaimerFor('tr'));
  });

  it('disclaimerFor falls back to en for unknown locales', () => {
    // @ts-expect-error testing fallback
    expect(disclaimerFor('zz')).toBe(disclaimerFor('en'));
  });
});
