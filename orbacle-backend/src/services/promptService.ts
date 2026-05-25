import type { Env } from '../types/env';
import type { ReadingType, Locale, AnswerCategory } from '../types/contract';

// Bundled fallback prompts (mirror seed/prompt_*.txt) used when KV has no prompt
// key. The real LLM (Phase 4) renders {{placeholders}} into these; in Phase 3
// they are only returned for completeness and never sent anywhere.
const FALLBACK_PROMPTS: Record<string, string> = {
  prompt_kahin_v1:
    'You are "Orbacle", a calm, poetic oracle. Give a SHORT reading in ' +
    '{{output_language}}: strictly 70-110 words, ONE paragraph, at most 5 sentences. ' +
    'Weave 1-2 concrete details from the seeker question in naturally; avoid clichés ' +
    'like "life journey" or "new chapter" and do not lean too hard on "listen to your ' +
    'inner voice". Reflect the real subject. ' +
    'money: NEVER give financial/investment advice, never say buy/sell/invest or tell ' +
    'them to take a risk; for risky-money questions emphasize caution, research, a budget ' +
    'limit, and what one can afford to lose; avoid "be bold / take the leap / do not miss ' +
    'the chance". career: leave the decision with the seeker (advantages, uncertainties, ' +
    'values, long-term direction), never "accept" or "reject". love: no definite claim ' +
    'about another person feelings, no manipulation. competition: frame around hope, ' +
    'pressure, preparation, the final stretch and steadiness; you may name the team; never ' +
    'give a definite result or score. ' +
    'Never give a definite prediction ("you will", "yes/no"); never give medical, legal, ' +
    'financial, or safety instructions. ' +
    'Question: {{question}} Whisper: {{whisper}} Category: {{category}}',
  prompt_deep_v1:
    'You are "Orbacle" performing a DEEP reading (250-400 words) in {{output_language}}, ' +
    'as four or five short flowing paragraphs (no headings, no lists). Move through: the ' +
    'visible sign, the real question beneath, what to be mindful of, a possible direction ' +
    '(an invitation, not a command), and one small awareness step. Weave 1-3 concrete ' +
    'details from the seeker question in naturally. ' +
    'money: NEVER give financial/investment advice, never say buy/sell/invest or encourage ' +
    'risk; keep a cautious frame (research, budget limit, what one can afford to lose). ' +
    'career: leave the decision with the seeker (advantages, uncertainties, values), never ' +
    '"accept"/"reject". love: no definite claim about another person feelings, no ' +
    'manipulation. competition: frame around hope, pressure, preparation and composure; you ' +
    'may name the team; never state a definite result or score. ' +
    'Never give a definite prediction ("you will", "yes/no") or professional medical/legal/' +
    'financial advice. Question: {{question}} Whisper: {{whisper}} Category: {{category}}',
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
// Legacy single-string render (kept for the mock path / completeness). The real
// LLM path uses buildMessages (role-based) below.
export async function renderPrompt(
  env: Env,
  promptVersion: string,
  input: RenderInput,
): Promise<string> {
  const template = await loadTemplate(env, promptVersion);
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

export interface ChatMessage {
  role: 'system' | 'user';
  content: string;
}

// Builds role-based chat messages for the LLM. The KV/bundled template becomes
// the SYSTEM message (rules + persona + output language), and the seeker's
// inputs go in a separate USER message. Keeping user input out of the system
// message reduces prompt-injection leverage: instructions hidden in the question
// can't masquerade as system rules. The system template still says to ignore any
// instructions inside the question.
export async function buildMessages(
  env: Env,
  promptVersion: string,
  input: RenderInput,
): Promise<ChatMessage[]> {
  const system = (await loadTemplate(env, promptVersion))
    .replaceAll('{{output_language}}', LOCALE_TO_LANGUAGE[input.locale] ?? 'English')
    // The system message no longer carries the seeker's text; clear any
    // placeholders so a template can be reused unchanged.
    .replaceAll('{{question}}', '(provided separately in the user message)')
    .replaceAll('{{whisper}}', '(provided separately in the user message)')
    .replaceAll('{{category}}', input.category);

  const user =
    `Seeker's question: ${input.question}\n` +
    `Orb whisper already shown: ${input.whisper}\n` +
    `Category hint: ${input.category}\n` +
    `Write the reading in ${LOCALE_TO_LANGUAGE[input.locale] ?? 'English'}.`;

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
}

async function loadTemplate(env: Env, promptVersion: string): Promise<string> {
  let template = FALLBACK_PROMPTS[promptVersion] ?? FALLBACK_PROMPTS.prompt_kahin_v1;
  if (env.CONFIG) {
    try {
      const fromKV = await env.CONFIG.get(promptVersion, 'text');
      if (fromKV) template = fromKV;
    } catch {
      // fall back to bundled template
    }
  }
  return template;
}
