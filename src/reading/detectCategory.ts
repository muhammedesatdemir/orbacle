import { Language, FALLBACK_LANGUAGE } from '../types/language';
import { AnswerCategory, FALLBACK_CATEGORY } from '../data/whispers/categories';
import { categoryKeywords } from '../data/whispers/categoryKeywords';

// Content categories carry topical meaning and compete with each other on
// keyword strength. `yesNo` is deliberately excluded: its markers (Turkish
// "mı/mi/mu", English "should i", etc.) appear in almost every question and
// would otherwise drown out the real topic. It is only used as a fallback when
// no content category matched at all. `general` is the final fallback.
const CONTENT_CATEGORIES: readonly Exclude<AnswerCategory, 'general' | 'yesNo'>[] = [
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
];

// Resolve the keyword list for a (category, language) pair, falling back to
// English then Turkish when a language has no set — so every language still
// gets at least some signal even if its own keywords were never filled in.
function keywordsFor(category: Exclude<AnswerCategory, 'general'>, language: Language): readonly string[] {
  const sets = categoryKeywords[category];
  return sets[language] ?? sets[FALLBACK_LANGUAGE] ?? sets.tr ?? [];
}

function scoreFor(category: Exclude<AnswerCategory, 'general'>, q: string, language: Language): number {
  let score = 0;
  for (const word of keywordsFor(category, language)) {
    if (q.includes(word)) score += 1;
  }
  return score;
}

// Pure, local category detection. First picks the strongest content category;
// only if none matched does it consider yesNo, then general. No network, no
// allocation beyond a lowercased copy of the question.
export function detectCategory(question: string, language: Language): AnswerCategory {
  const q = question.toLowerCase();
  if (!q.trim()) return FALLBACK_CATEGORY;

  let best: AnswerCategory = FALLBACK_CATEGORY;
  let bestScore = 0;

  for (const category of CONTENT_CATEGORIES) {
    const score = scoreFor(category, q, language);
    // Strict > keeps the earlier (higher-priority) category on ties, matching
    // CONTENT_CATEGORIES order (love before decision, etc.).
    if (score > bestScore) {
      bestScore = score;
      best = category;
    }
  }

  if (bestScore > 0) return best;

  // No topic detected — fall back to a yes/no reading if the phrasing looks
  // like a yes/no question, otherwise stay general.
  if (scoreFor('yesNo', q, language) > 0) return 'yesNo';

  return FALLBACK_CATEGORY;
}
