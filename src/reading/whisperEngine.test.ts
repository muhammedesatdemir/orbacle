/**
 * Dependency-free self-test for the Layer-1 whisper engine and category
 * detection. This project has no test runner, so the tests are plain TypeScript
 * assertions runnable via the npm `test` script:
 *
 *   npm test
 *
 * which compiles this file to a temp dir with the CommonJS target and runs it on
 * Node. It type-checks (tsc --noEmit covers it too) and exits non-zero on the
 * first failed assertion. Pure logic only — no React Native imports in the chain.
 */
import assert from 'assert';
import { detectCategory } from './detectCategory';
import { getWhisper } from './whisperEngine';
import { supportedLanguages, Language } from '../types/language';
import { ANSWER_CATEGORIES, AnswerCategory } from '../data/whispers/categories';

let passed = 0;
function check(name: string, fn: () => void): void {
  fn();
  passed += 1;
  // eslint-disable-next-line no-console
  console.log(`  ✓ ${name}`);
}

// --- detectCategory: keyword → category (tr / en) ---------------------------
check('tr: aşk keyword → love', () => {
  assert.strictEqual(detectCategory('Beni hâlâ seviyor mu, aşkım geri döner mi?', 'tr'), 'love');
});
check('tr: para keyword → money', () => {
  assert.strictEqual(detectCategory('Bu parayı borç ödemek için harcamalı mıyım?', 'tr'), 'money');
});
check('tr: iş keyword → career', () => {
  assert.strictEqual(detectCategory('Yeni iş teklifini kabul edip kariyerime yön vermeli miyim?', 'tr'), 'career');
});
check('en: love keyword → love', () => {
  assert.strictEqual(detectCategory('Does my crush still love me after the breakup?', 'en'), 'love');
});
check('en: money keyword → money', () => {
  assert.strictEqual(detectCategory('Should I spend my savings to pay off this debt?', 'en'), 'money');
});
check('en: career keyword → career', () => {
  assert.strictEqual(detectCategory('Will my boss approve the promotion at work?', 'en'), 'career');
});

// --- detectCategory: competition (sport / contest) -------------------------
check('tr: Fenerbahçe şampiyon olacak mı? → competition', () => {
  assert.strictEqual(detectCategory('Fenerbahçe şampiyon olacak mı?', 'tr'), 'competition');
});
check('tr: Galatasaray maçı kazanır mı? → competition (beats yesNo)', () => {
  assert.strictEqual(detectCategory('Galatasaray maçı kazanır mı?', 'tr'), 'competition');
});
check('en: Will this team win the championship? → competition', () => {
  assert.strictEqual(detectCategory('Will this team win the championship?', 'en'), 'competition');
});
check('en: cup final question → competition', () => {
  assert.strictEqual(detectCategory('Who lifts the cup in the final?', 'en'), 'competition');
});

// --- detectCategory: yes/no phrasing without a topic → yesNo ---------------
// yesNo is a fallback below content categories: it only wins when no content
// topic matched, so a bare yes/no question lands here while a topical one does
// not. "Will it" carries no topic keyword, so it falls through to yesNo.
check('en: bare yes/no question → yesNo', () => {
  assert.strictEqual(detectCategory('Will it?', 'en'), 'yesNo');
});
check('tr: bare yes/no question → yesNo', () => {
  assert.strictEqual(detectCategory('Olur mu?', 'tr'), 'yesNo');
});
check('en: topical yes/no question prefers the topic over yesNo', () => {
  assert.strictEqual(detectCategory('Will I find love again?', 'en'), 'love');
});

// --- detectCategory: vague / empty → general -------------------------------
check('tr: vague question → general', () => {
  assert.strictEqual(detectCategory('Ne yapmalıyım?', 'tr'), 'general');
});
check('en: vague question → general', () => {
  assert.strictEqual(detectCategory('What now?', 'en'), 'general');
});
check('empty string → general', () => {
  assert.strictEqual(detectCategory('   ', 'en'), 'general');
});

// --- detectCategory: smoke test across all languages -----------------------
// English keywords are matched as a fallback when a language lacks its own, so
// an English love phrase should resolve to a love-ish (non-empty) category in
// every language without throwing.
check('all languages: detection runs and returns a valid category', () => {
  for (const { code } of supportedLanguages) {
    const cat = detectCategory('love and relationship', code);
    assert.ok(ANSWER_CATEGORIES.includes(cat), `${code} returned invalid category: ${cat}`);
  }
});

// --- getWhisper: returns text + category for every language ----------------
check('all languages: getWhisper returns non-empty text and valid category', () => {
  for (const { code } of supportedLanguages) {
    const r = getWhisper('Aşkım bana geri dönecek mi?', code);
    assert.ok(typeof r.text === 'string' && r.text.length > 0, `${code} empty whisper text`);
    assert.notStrictEqual(r.text, '...', `${code} fell through to placeholder`);
    assert.ok(ANSWER_CATEGORIES.includes(r.category), `${code} invalid category`);
  }
});

// --- getWhisper: love question draws from the love pool --------------------
check('tr: love question yields love category and an actual love-pool whisper', () => {
  const r = getWhisper('Eski sevgilime tekrar yazmalı mıyım, aşk geri döner mi?', 'tr');
  assert.strictEqual(r.category, 'love');
  // The returned text must be one of the categorized love whispers, not a flat
  // fallback — proves the categorized pool is actually wired up.
  const lovePool: string[] = require('../data/answers.categorized.tr.json').love;
  assert.ok(lovePool.includes(r.text), 'whisper did not come from the love pool');
});

// --- getWhisper fallback: vague question still returns a general whisper ---
check('en: vague question returns a general-category whisper', () => {
  const r = getWhisper('hmm', 'en');
  assert.strictEqual(r.category, 'general');
  const generalPool: string[] = require('../data/answers.categorized.en.json').general;
  assert.ok(generalPool.includes(r.text), 'whisper did not come from the general pool');
});

// --- getWhisper: no consecutive repeats within a category -----------------
check('repeat avoidance: consecutive whispers in a category differ', () => {
  const q = 'Should I text my ex about our relationship?';
  let prev = getWhisper(q, 'en').text;
  for (let i = 0; i < 20; i++) {
    const next = getWhisper(q, 'en').text;
    assert.notStrictEqual(next, prev, 'two consecutive whispers were identical');
    prev = next;
  }
});

// --- integrity: every categorized file has all 12 categories, non-empty ---
check('all languages: categorized files cover all 12 categories with >= 1 entry', () => {
  for (const { code } of supportedLanguages) {
    const file = require(`../data/answers.categorized.${code}.json`) as Record<string, unknown>;
    for (const cat of ANSWER_CATEGORIES) {
      const pool = file[cat];
      assert.ok(Array.isArray(pool) && pool.length >= 1, `${code}.${cat} missing or empty`);
    }
  }
});

// eslint-disable-next-line no-console
console.log(`\n${passed} checks passed.`);

// Keep TS happy about the unused Language/AnswerCategory imports being purely types.
export type { Language, AnswerCategory };
