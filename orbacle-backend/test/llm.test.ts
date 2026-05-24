import { describe, it, expect, vi, afterEach } from 'vitest';
import type { Env } from '../src/types/env';
import { DEFAULT_CONFIG, type AppConfig } from '../src/services/configService';
import {
  generateReading,
  resolveProvider,
  sanitizeOutput,
  type LlmInput,
} from '../src/services/llmService';
import { ApiError } from '../src/lib/errors';
import type { ChatMessage } from '../src/services/promptService';

const messages: ChatMessage[] = [
  { role: 'system', content: 'You are Orbacle.' },
  { role: 'user', content: 'Should I?' },
];

function kahinInput(overrides: Partial<LlmInput> = {}): LlmInput {
  return {
    tier: 'kahin',
    messages,
    locale: 'tr',
    category: 'general',
    model: 'gpt-4o-mini',
    maxTokens: 220,
    temperature: 0.8,
    ...overrides,
  };
}

const realConfig: AppConfig = { ...DEFAULT_CONFIG, useMockLLM: false };

function mockFetchOnce(impl: () => Promise<Response> | Response) {
  const fn = vi.fn(impl);
  vi.stubGlobal('fetch', fn);
  return fn;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('resolveProvider (env overrides config; the original bug)', () => {
  // DEFAULT_CONFIG.useMockLLM is true. The env var must be able to flip it off.
  it('Kâhin: USE_MOCK_LLM="false" string + key → openai (config default true is overridden)', () => {
    const env = { USE_MOCK_LLM: 'false', OPENAI_API_KEY: 'sk-test', ENVIRONMENT: 'development' } as Env;
    const r = resolveProvider(env, DEFAULT_CONFIG, 'kahin');
    expect(r.useMock).toBe(false);
    expect(r.provider).toBe('openai');
  });

  it('Kâhin: USE_MOCK_LLM="true" + key → mock', () => {
    const env = { USE_MOCK_LLM: 'true', OPENAI_API_KEY: 'sk-test' } as Env;
    expect(resolveProvider(env, DEFAULT_CONFIG, 'kahin').provider).toBe('mock');
  });

  it('Kâhin: USE_MOCK_LLM="0" + key → openai', () => {
    const env = { USE_MOCK_LLM: '0', OPENAI_API_KEY: 'sk-test' } as Env;
    expect(resolveProvider(env, DEFAULT_CONFIG, 'kahin').provider).toBe('openai');
  });

  it('Kâhin: USE_MOCK_LLM="1" + key → mock', () => {
    const env = { USE_MOCK_LLM: '1', OPENAI_API_KEY: 'sk-test' } as Env;
    expect(resolveProvider(env, DEFAULT_CONFIG, 'kahin').provider).toBe('mock');
  });

  it('Kâhin: USE_MOCK_LLM=false boolean + key → openai', () => {
    const env = { USE_MOCK_LLM: false as unknown as string, OPENAI_API_KEY: 'sk-test' } as Env;
    expect(resolveProvider(env, DEFAULT_CONFIG, 'kahin').provider).toBe('openai');
  });

  it('Kâhin: USE_MOCK_LLM="false" but NO key → still openai provider (route returns UPSTREAM_ERROR)', () => {
    const env = { USE_MOCK_LLM: 'false' } as Env;
    const r = resolveProvider(env, DEFAULT_CONFIG, 'kahin');
    expect(r.provider).toBe('openai');
    expect(r.hasKey).toBe(false);
  });

  it('Kâhin: env var absent → falls back to config default (mock)', () => {
    const env = { OPENAI_API_KEY: 'sk-test' } as Env;
    expect(resolveProvider(env, DEFAULT_CONFIG, 'kahin').provider).toBe('mock');
  });

  it('Deep: ALWAYS mock regardless of env/key', () => {
    const env = { USE_MOCK_LLM: 'false', OPENAI_API_KEY: 'sk-test' } as Env;
    expect(resolveProvider(env, DEFAULT_CONFIG, 'deep').provider).toBe('mock');
  });
});

describe('generateReading — env-driven real path (the bug scenario, end to end)', () => {
  it('USE_MOCK_LLM="false" string + key calls OpenAI even with default config', async () => {
    const calls = mockFetchOnce(() =>
      new Response(
        JSON.stringify({
          choices: [{ message: { content: 'Mor çorap işareti uğuru çağırıyor.' } }],
          usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
        }),
        { status: 200 },
      ),
    );
    const env = { USE_MOCK_LLM: 'false', OPENAI_API_KEY: 'sk-test' } as Env;
    const r = await generateReading(env, DEFAULT_CONFIG, kahinInput());
    expect(calls).toHaveBeenCalledOnce();
    expect(r.model).toBe('gpt-4o-mini');
    expect(r.text).toContain('Mor çorap');
  });

  it('USE_MOCK_LLM="false" string + NO key → UPSTREAM_ERROR (no quota spend), no fetch', async () => {
    const calls = mockFetchOnce(() => new Response('{}', { status: 200 }));
    const env = { USE_MOCK_LLM: 'false' } as Env;
    await expect(generateReading(env, DEFAULT_CONFIG, kahinInput())).rejects.toMatchObject({
      code: 'UPSTREAM_ERROR',
    });
    expect(calls).not.toHaveBeenCalled();
  });

  it('Deep with USE_MOCK_LLM="false" + key still returns mock (never calls OpenAI)', async () => {
    const calls = mockFetchOnce(() => new Response('{}', { status: 200 }));
    const env = { USE_MOCK_LLM: 'false', OPENAI_API_KEY: 'sk-test' } as Env;
    const r = await generateReading(env, DEFAULT_CONFIG, kahinInput({ tier: 'deep' }));
    expect(r.model).toBe('mock');
    expect(calls).not.toHaveBeenCalled();
  });
});

describe('generateReading — mock path', () => {
  it('Deep ALWAYS uses the mock, even with real config + key', async () => {
    const env = { OPENAI_API_KEY: 'sk-test' } as Env;
    const r = await generateReading(env, realConfig, kahinInput({ tier: 'deep' }));
    expect(r.model).toBe('mock');
    expect(r.text.length).toBeGreaterThan(50);
  });

  it('Kâhin uses the mock when useMockLLM=true', async () => {
    const env = {} as Env;
    const r = await generateReading(env, DEFAULT_CONFIG, kahinInput());
    expect(r.model).toBe('mock');
  });

  it('competition category yields a sport/contest-flavoured mock (not generic)', async () => {
    const env = {} as Env;
    const tr = await generateReading(env, DEFAULT_CONFIG, kahinInput({ category: 'competition' }));
    // Turkish competition mock mentions championship-context words.
    expect(tr.text.toLowerCase()).toMatch(/şampiyon|skor|son düzlük|rakip|saha/);
    // And differs from the generic Kâhin mock.
    const generic = await generateReading(env, DEFAULT_CONFIG, kahinInput({ category: 'general' }));
    expect(tr.text).not.toBe(generic.text);
  });

  it('competition Deep mock is also contest-flavoured', async () => {
    const env = {} as Env;
    const r = await generateReading(env, DEFAULT_CONFIG, kahinInput({ tier: 'deep', category: 'competition' }));
    expect(r.text.toLowerCase()).toMatch(/rekabet|skor|son düzlük|baskı/);
  });
});

describe('generateReading — real path (Kâhin, useMockLLM=false)', () => {
  it('returns sanitized text + usage on a successful OpenAI response', async () => {
    const calls = mockFetchOnce(() =>
      new Response(
        JSON.stringify({
          choices: [{ message: { content: '  Kürenin işareti seni sabra çağırıyor.  ' } }],
          usage: { prompt_tokens: 50, completion_tokens: 30, total_tokens: 80 },
        }),
        { status: 200 },
      ),
    );
    const env = { OPENAI_API_KEY: 'sk-test' } as Env;
    const r = await generateReading(env, realConfig, kahinInput());
    expect(calls).toHaveBeenCalledOnce();
    expect(r.text).toBe('Kürenin işareti seni sabra çağırıyor.');
    expect(r.model).toBe('gpt-4o-mini');
    expect(r.totalTokens).toBe(80);
  });

  it('throws UPSTREAM_ERROR when no API key is configured (no quota spend upstream)', async () => {
    const env = {} as Env; // no OPENAI_API_KEY
    await expect(generateReading(env, realConfig, kahinInput())).rejects.toMatchObject({
      code: 'UPSTREAM_ERROR',
    });
  });

  it('retries once then throws UPSTREAM_ERROR on persistent HTTP failure', async () => {
    const calls = mockFetchOnce(() => new Response('rate limited', { status: 429 }));
    const env = { OPENAI_API_KEY: 'sk-test' } as Env;
    await expect(generateReading(env, realConfig, kahinInput())).rejects.toBeInstanceOf(ApiError);
    expect(calls).toHaveBeenCalledTimes(2); // initial + 1 retry
  });

  it('throws UPSTREAM_ERROR on an empty completion', async () => {
    mockFetchOnce(() =>
      new Response(JSON.stringify({ choices: [{ message: { content: '   ' } }] }), { status: 200 }),
    );
    const env = { OPENAI_API_KEY: 'sk-test' } as Env;
    await expect(generateReading(env, realConfig, kahinInput())).rejects.toMatchObject({
      code: 'UPSTREAM_ERROR',
    });
  });
});

describe('sanitizeOutput', () => {
  it('trims and strips leaked technical wording', () => {
    expect(sanitizeOutput('  As an AI, the orb says wait.  ')).not.toMatch(/as an ai/i);
    expect(sanitizeOutput('OpenAI GPT-4 reading here')).not.toMatch(/openai|gpt/i);
    expect(sanitizeOutput('Yapay zeka diyor ki bekle')).not.toMatch(/yapay zeka/i);
  });

  it('clamps long output to ~maxWords words', () => {
    // 60 sentences of 4 words each = 240 words; clamp to 120.
    const long = Array.from({ length: 60 }, (_, i) => `This is sentence ${i}.`).join(' ');
    const out = sanitizeOutput(long, 120);
    const words = out.split(/\s+/).filter(Boolean).length;
    expect(words).toBeLessThanOrEqual(120);
    expect(words).toBeGreaterThan(80); // not over-trimmed
  });

  it('ends a clamped reading on a sentence boundary (no half sentence)', () => {
    const long = Array.from({ length: 60 }, (_, i) => `Word word word here ${i}.`).join(' ');
    const out = sanitizeOutput(long, 40);
    expect(out).toMatch(/[.!?…]$/); // clean ending
  });

  it('normalizes a multi-paragraph / list answer into one flowing paragraph', () => {
    const listy = 'The orb shows:\n- first sign\n- second sign\n\n1. a path\n2. a choice';
    const out = sanitizeOutput(listy);
    expect(out).not.toMatch(/\n/); // single paragraph
    expect(out).not.toMatch(/^[-*•]|\b\d+[.)]\s/); // no list markers
    expect(out).toContain('first sign');
  });

  it('keeps short readings unchanged (within the word budget)', () => {
    const short = 'A waiting heart sees clearer. Stay steady and let the moment ripen.';
    expect(sanitizeOutput(short)).toBe(short);
  });
});
