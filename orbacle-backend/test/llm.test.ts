import { describe, it, expect, vi, afterEach } from 'vitest';
import type { Env } from '../src/types/env';
import { DEFAULT_CONFIG, type AppConfig } from '../src/services/configService';
import { generateReading, sanitizeOutput, type LlmInput } from '../src/services/llmService';
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

  it('clamps very long output', () => {
    const long = 'word. '.repeat(500);
    expect(sanitizeOutput(long, 200).length).toBeLessThanOrEqual(200);
  });

  it('collapses excessive blank lines', () => {
    expect(sanitizeOutput('a\n\n\n\n\nb')).toBe('a\n\nb');
  });
});
