import { Language } from '../../types/language';

// The twelve whisper categories. Order is stable; `general` is always the
// final fallback both for detection (no keyword matched) and for content
// (an empty category pool falls back to the flat answers.{lang}.json pool).
export type AnswerCategory =
  | 'love'
  | 'decision'
  | 'career'
  | 'money'
  | 'family'
  | 'daily'
  | 'uncertainty'
  | 'patience'
  | 'warning'
  | 'newBeginning'
  | 'competition'
  | 'yesNo'
  | 'general';

export const ANSWER_CATEGORIES: readonly AnswerCategory[] = [
  'love',
  'decision',
  'career',
  'money',
  'family',
  'daily',
  'uncertainty',
  'patience',
  'warning',
  'newBeginning',
  'competition',
  'yesNo',
  'general',
] as const;

export const FALLBACK_CATEGORY: AnswerCategory = 'general';

// Shape of every src/data/answers.categorized.{lang}.json file. Each category
// maps to a flat list of single-sentence whispers. A category may be omitted
// or empty — callers must fall back when a pool is missing.
export type CategorizedAnswers = Partial<Record<AnswerCategory, string[]>>;

// Per-language keyword sets used by detectCategory. `general` is intentionally
// absent (it is the no-match fallback, not keyword-driven). Languages may omit
// entries; detection falls back to en/tr keywords when a language is missing.
export type CategoryKeywords = {
  readonly [C in Exclude<AnswerCategory, 'general'>]: Partial<Record<Language, readonly string[]>>;
};
