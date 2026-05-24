import type { Env } from '../types/env';
import type { ReadingType, Locale, AnswerCategory } from '../types/contract';

// Bundled fallback prompts (mirror seed/prompt_*.txt) used when KV has no prompt
// key. The real LLM (Phase 4) renders {{placeholders}} into these; in Phase 3
// they are only returned for completeness and never sent anywhere.
const FALLBACK_PROMPTS: Record<string, string> = {
  prompt_kahin_v1:
    'You are "Orbacle", a calm, poetic oracle. Give a short (80-130 words) warm, ' +
    'reflective reading in {{output_language}} that gently weaves in the orb whisper. ' +
    'Never give a definite prediction; never give medical, legal, financial, or safety ' +
    'instructions. Question: {{question}} Whisper: {{whisper}} Category: {{category}}',
  prompt_deep_v1:
    'You are "Orbacle" performing a DEEP reading (250-400 words) in {{output_language}}. ' +
    'Move through: the visible sign, the real question beneath, what to be mindful of, a ' +
    'possible direction (an invitation, not a command), and one small awareness step. ' +
    'Never give a definite prediction or professional advice. Question: {{question}} ' +
    'Whisper: {{whisper}} Category: {{category}}',
};

export const LOCALE_TO_LANGUAGE: Record<Locale, string> = {
  tr: 'Turkish',
  en: 'English',
  'es-LA': 'Latin American Spanish',
  'pt-BR': 'Brazilian Portuguese',
  'hi-IN': 'Hindi',
  'id-ID': 'Indonesian',
  ar: 'Arabic',
  'de-DE': 'German',
  'fr-FR': 'French',
  'ja-JP': 'Japanese',
};

export interface RenderInput {
  question: string;
  whisper: string;
  category: AnswerCategory;
  locale: Locale;
}

// Loads the active prompt template from KV (fallback to bundled) and fills in
// placeholders. Returned to the LLM service; not used by the mock path directly.
export async function renderPrompt(
  env: Env,
  promptVersion: string,
  input: RenderInput,
): Promise<string> {
  let template = FALLBACK_PROMPTS[promptVersion] ?? FALLBACK_PROMPTS.prompt_kahin_v1;
  if (env.CONFIG) {
    try {
      const fromKV = await env.CONFIG.get(promptVersion, 'text');
      if (fromKV) template = fromKV;
    } catch {
      // fall back to bundled template
    }
  }
  return template
    .replaceAll('{{output_language}}', LOCALE_TO_LANGUAGE[input.locale] ?? 'English')
    .replaceAll('{{question}}', input.question)
    .replaceAll('{{whisper}}', input.whisper)
    .replaceAll('{{category}}', input.category);
}

export function promptVersionFor(
  tier: ReadingType,
  versions: { kahin: string; deep: string },
): string {
  return tier === 'kahin' ? versions.kahin : versions.deep;
}
