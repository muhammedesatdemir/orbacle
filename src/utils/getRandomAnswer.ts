import { Language, FALLBACK_LANGUAGE } from '../types/language';
import answersTr from '../data/answers.tr.json';
import answersEn from '../data/answers.en.json';
import answersEsLA from '../data/answers.es-LA.json';
import answersPtBR from '../data/answers.pt-BR.json';
import answersHiIN from '../data/answers.hi-IN.json';
import answersIdID from '../data/answers.id-ID.json';
import answersAr from '../data/answers.ar.json';
import answersDeDE from '../data/answers.de-DE.json';
import answersFrFR from '../data/answers.fr-FR.json';
import answersJaJP from '../data/answers.ja-JP.json';

const answersMap: Record<Language, string[]> = {
  tr: answersTr,
  en: answersEn,
  'es-LA': answersEsLA,
  'pt-BR': answersPtBR,
  'hi-IN': answersHiIN,
  'id-ID': answersIdID,
  ar: answersAr,
  'de-DE': answersDeDE,
  'fr-FR': answersFrFR,
  'ja-JP': answersJaJP,
};

// If a language's pool is empty or missing for any reason, fall back to English
// rather than returning '...' and breaking the user experience.
function poolFor(language: Language): string[] {
  const pool = answersMap[language];
  if (pool && pool.length > 0) return pool;
  return answersMap[FALLBACK_LANGUAGE];
}

const RECENT_LIMIT = 10;
let recentAnswers: string[] = [];

// Picks a random answer from `pool` while avoiding the last few results held in
// the shared `recent` list (mutated in place, capped at RECENT_LIMIT). Extracted
// so the categorized whisper engine can reuse the exact same repeat-avoidance
// behaviour as getRandomAnswer. Safe for any non-empty pool.
export function pickNonRecent(pool: string[], recent: string[] = recentAnswers): string {
  if (pool.length === 0) return '...';
  if (pool.length === 1) return pool[0];

  // Don't let the recent-history filter exceed the pool size, or the loop never exits.
  const blockCount = Math.min(recent.length, pool.length - 1, RECENT_LIMIT);
  const blocked = recent.slice(-blockCount);

  let answer: string;
  do {
    answer = pool[Math.floor(Math.random() * pool.length)];
  } while (blocked.includes(answer));

  recent.push(answer);
  if (recent.length > RECENT_LIMIT) {
    // Trim in place so the caller's array (and the module-level default) keeps
    // its identity rather than being reassigned.
    recent.splice(0, recent.length - RECENT_LIMIT);
  }
  return answer;
}

export function getRandomAnswer(language: Language): string {
  const pool = poolFor(language);
  if (!pool || pool.length === 0) return '...';
  return pickNonRecent(pool);
}

// Deterministic answer for a given calendar day: the same date + language
// always yields the same answer, so "answer of the day" is stable on re-open.
export function getDeterministicAnswer(language: Language, dateKey: string): string {
  const pool = poolFor(language);
  if (!pool || pool.length === 0) return '...';

  let hash = 0;
  const seed = `${dateKey}:${language}`;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % pool.length;
  return pool[index];
}
