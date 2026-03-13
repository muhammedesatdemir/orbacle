import { Language } from '../types/language';
import answersEn from '../data/answers.en.json';
import answersTr from '../data/answers.tr.json';

const answersMap: Record<Language, string[]> = {
  en: answersEn,
  tr: answersTr,
};

let lastAnswer: string | null = null;

export function getRandomAnswer(language: Language): string {
  const pool = answersMap[language];
  if (!pool || pool.length === 0) return '...';
  if (pool.length === 1) return pool[0];

  let answer: string;
  do {
    answer = pool[Math.floor(Math.random() * pool.length)];
  } while (answer === lastAnswer);

  lastAnswer = answer;
  return answer;
}
