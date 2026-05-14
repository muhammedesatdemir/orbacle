import { Language } from '../types/language';
import answersEn from '../data/answers.en.json';
import answersTr from '../data/answers.tr.json';

const answersMap: Record<Language, string[]> = {
  en: answersEn,
  tr: answersTr,
};

const RECENT_LIMIT = 10;
let recentAnswers: string[] = [];

export function getRandomAnswer(language: Language): string {
  const pool = answersMap[language];
  if (!pool || pool.length === 0) return '...';
  if (pool.length === 1) return pool[0];

  // Don't let the recent-history filter exceed the pool size, or the loop never exits.
  const blockCount = Math.min(recentAnswers.length, pool.length - 1, RECENT_LIMIT);
  const blocked = recentAnswers.slice(-blockCount);

  let answer: string;
  do {
    answer = pool[Math.floor(Math.random() * pool.length)];
  } while (blocked.includes(answer));

  recentAnswers.push(answer);
  if (recentAnswers.length > RECENT_LIMIT) {
    recentAnswers = recentAnswers.slice(-RECENT_LIMIT);
  }
  return answer;
}

// Deterministic answer for a given calendar day: the same date + language
// always yields the same answer, so "answer of the day" is stable on re-open.
export function getDeterministicAnswer(language: Language, dateKey: string): string {
  const pool = answersMap[language];
  if (!pool || pool.length === 0) return '...';

  let hash = 0;
  const seed = `${dateKey}:${language}`;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % pool.length;
  return pool[index];
}
