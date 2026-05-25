import { describe, it, expect } from 'vitest';
import type { Env } from '../src/types/env';
import { buildMessages } from '../src/services/promptService';

// No KV bound → buildMessages uses the bundled FALLBACK_PROMPTS, which mirror
// seed/prompt_kahin_v1.txt. We assert the system message carries the tightened
// length + safety rules.
const env = {} as Env;

async function systemMessage(category: Parameters<typeof buildMessages>[2]['category']) {
  const msgs = await buildMessages(env, 'prompt_kahin_v1', {
    question: 'Should I risk my savings on this?',
    whisper: 'A patient purse outlasts a hurried wallet.',
    category,
    locale: 'en',
  });
  return msgs.find((m) => m.role === 'system')?.content ?? '';
}

describe('Kâhin prompt — length rule', () => {
  it('states the 70-110 word / one paragraph / max 5 sentences limit', async () => {
    const sys = (await systemMessage('general')).toLowerCase();
    expect(sys).toContain('70-110 words');
    expect(sys).toContain('one paragraph');
    expect(sys).toContain('5 sentences');
  });
});

describe('Kâhin prompt — money safety', () => {
  it('forbids financial/investment advice and risk-encouraging phrasing', async () => {
    const sys = (await systemMessage('money')).toLowerCase();
    expect(sys).toContain('never give financial/investment advice');
    expect(sys).toMatch(/buy\/sell\/invest/);
    expect(sys).toMatch(/caution|research|budget|afford to lose/);
    // Discourages encouraging phrasing.
    expect(sys).toMatch(/be bold|take the leap|do not miss the chance/);
  });
});

describe('Kâhin prompt — other category guards', () => {
  it('career leaves the decision with the seeker', async () => {
    const sys = (await systemMessage('career')).toLowerCase();
    expect(sys).toMatch(/leave the decision with the seeker/);
  });
  it('love makes no definite claim about another person feelings', async () => {
    const sys = (await systemMessage('love')).toLowerCase();
    expect(sys).toMatch(/no definite claim about another person|no manipulation/);
  });
  it('competition never gives a definite result or score', async () => {
    const sys = (await systemMessage('competition')).toLowerCase();
    expect(sys).toMatch(/never give a definite result or score/);
  });
});

describe('Kâhin prompt — role separation', () => {
  it('puts the seeker question in a separate user message, not the system one', async () => {
    const msgs = await buildMessages(env, 'prompt_kahin_v1', {
      question: 'UNIQUE_TEST_QUESTION_12345',
      whisper: 'w',
      category: 'general',
      locale: 'en',
    });
    const sys = msgs.find((m) => m.role === 'system')?.content ?? '';
    const user = msgs.find((m) => m.role === 'user')?.content ?? '';
    expect(sys).not.toContain('UNIQUE_TEST_QUESTION_12345');
    expect(user).toContain('UNIQUE_TEST_QUESTION_12345');
  });
});

async function deepSystem(category: Parameters<typeof buildMessages>[2]['category']) {
  const msgs = await buildMessages(env, 'prompt_deep_v1', {
    question: 'Should I risk my savings on this?',
    whisper: 'A patient purse outlasts a hurried wallet.',
    category,
    locale: 'en',
  });
  return msgs.find((m) => m.role === 'system')?.content ?? '';
}

describe('Deep prompt — structure & length', () => {
  it('states the 250-400 word, multi-paragraph deep structure', async () => {
    const sys = (await deepSystem('general')).toLowerCase();
    expect(sys).toContain('250-400 words');
    expect(sys).toMatch(/visible sign/);
    expect(sys).toMatch(/real question/);
  });
});

describe('Deep prompt — safety guards', () => {
  it('forbids definite prediction and professional advice', async () => {
    const sys = (await deepSystem('general')).toLowerCase();
    expect(sys).toMatch(/never give a definite prediction/);
    expect(sys).toMatch(/professional|medical|legal|financial/);
  });
  it('money: forbids financial/investment advice and risk encouragement', async () => {
    const sys = (await deepSystem('money')).toLowerCase();
    expect(sys).toMatch(/never give financial\/investment advice/);
    expect(sys).toMatch(/buy\/sell\/invest/);
    expect(sys).toMatch(/budget limit|afford to lose|research/);
  });
  it('competition: never states a definite result or score', async () => {
    const sys = (await deepSystem('competition')).toLowerCase();
    expect(sys).toMatch(/never state a definite result or score/);
  });
  it('love: no definite claim about another person feelings', async () => {
    const sys = (await deepSystem('love')).toLowerCase();
    expect(sys).toMatch(/no definite claim about another person|no manipulation/);
  });
});
