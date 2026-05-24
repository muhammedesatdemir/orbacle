import { Language, FALLBACK_LANGUAGE } from '../types/language';
import { AnswerCategory, CategorizedAnswers } from '../data/whispers/categories';
import { detectCategory } from './detectCategory';
import { getRandomAnswer, pickNonRecent } from '../utils/getRandomAnswer';

import categorizedTr from '../data/answers.categorized.tr.json';
import categorizedEn from '../data/answers.categorized.en.json';
import categorizedEsLA from '../data/answers.categorized.es-LA.json';
import categorizedPtBR from '../data/answers.categorized.pt-BR.json';
import categorizedHiIN from '../data/answers.categorized.hi-IN.json';
import categorizedIdID from '../data/answers.categorized.id-ID.json';
import categorizedAr from '../data/answers.categorized.ar.json';
import categorizedDeDE from '../data/answers.categorized.de-DE.json';
import categorizedFrFR from '../data/answers.categorized.fr-FR.json';
import categorizedJaJP from '../data/answers.categorized.ja-JP.json';

const categorizedMap: Record<Language, CategorizedAnswers> = {
  tr: categorizedTr,
  en: categorizedEn,
  'es-LA': categorizedEsLA,
  'pt-BR': categorizedPtBR,
  'hi-IN': categorizedHiIN,
  'id-ID': categorizedIdID,
  ar: categorizedAr,
  'de-DE': categorizedDeDE,
  'fr-FR': categorizedFrFR,
  'ja-JP': categorizedJaJP,
};

export interface WhisperResult {
  text: string;
  category: AnswerCategory;
}

// Separate recent-history list per language+category combo so avoiding repeats
// within a category doesn't starve unrelated categories. Lives at module scope
// alongside the engine; resets on app restart, same as getRandomAnswer.
const recentByPool: Record<string, string[]> = {};

function recentFor(language: Language, category: AnswerCategory): string[] {
  const key = `${language}:${category}`;
  return (recentByPool[key] ??= []);
}

// Returns the categorized pool for a language+category, falling back to the
// same category in the fallback language, then null when nothing usable exists.
function categorizedPoolFor(language: Language, category: AnswerCategory): string[] | null {
  const own = categorizedMap[language]?.[category];
  if (own && own.length > 0) return own;
  const fallback = categorizedMap[FALLBACK_LANGUAGE]?.[category];
  if (fallback && fallback.length > 0) return fallback;
  return null;
}

// The Layer-1 "Küre Fısıltısı" engine: detects the question's category locally
// and draws a whisper from that category's pool. Falls back to the existing flat
// getRandomAnswer(language) behaviour whenever the categorized pool is missing,
// empty, or anything goes wrong — so the classic experience is always preserved.
export function getWhisper(question: string, language: Language): WhisperResult {
  try {
    const category = detectCategory(question, language);
    const pool = categorizedPoolFor(language, category);
    if (pool) {
      return { text: pickNonRecent(pool, recentFor(language, category)), category };
    }
    // Categorized content not available for this category/language yet.
    return { text: getRandomAnswer(language), category };
  } catch {
    // Any unexpected failure (malformed JSON, etc.) must never break the orb.
    return { text: getRandomAnswer(language), category: 'general' };
  }
}
