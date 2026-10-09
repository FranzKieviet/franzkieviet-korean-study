// Checks the conjugation engine, number readings, and that every grammar topic
// produces questions whose own answers are graded as correct.
// Run: npm test
import assert from 'node:assert/strict';
import { FORMS } from '../site/js/hangul.js';
import { sino, nativeCounter, month, time } from '../site/js/numbers.js';
import { ALL_TOPICS, makeQuestion } from '../site/js/data/grammar.js';
import { findVerb } from '../site/js/data/words.js';
import { makeRng } from '../site/js/rng.js';
import { isCorrect } from '../site/js/quiz.js';
import { numberQuestion, NUM_MODES } from '../site/js/practice.js';
import { NUM_CATEGORIES } from '../site/js/numbers.js';
import { acceptQuestions } from '../site/js/ai.js';

const cases = [
  ['먹다', 'present', '먹어요'], ['가다', 'past', '갔어요'], ['보다', 'present', '봐요'], ['마시다', 'past', '마셨어요'],
  ['공부하다', 'negative', '공부 안 해요'], ['좋아하다', 'negative', '안 좋아해요'], ['듣다', 'present', '들어요'],
  ['듣다', 'future', '들을 거예요'], ['만들다', 'honorific', '만드세요'], ['살다', 'modPresent', '사는'], ['살다', 'formal', '삽니다'],
  ['돕다', 'present', '도와요'], ['춥다', 'present', '추워요'], ['춥다', 'modPresent', '추운'], ['짓다', 'present', '지어요'],
  ['낫다', 'past', '나았어요'], ['모르다', 'present', '몰라요'], ['빠르다', 'past', '빨랐어요'], ['쓰다', 'present', '써요'],
  ['바쁘다', 'present', '바빠요'], ['배고프다', 'because', '배고파서요'], ['그렇다', 'present', '그래요'], ['그렇다', 'modPresent', '그런'],
  ['하얗다', 'present', '하얘요'], ['맛있다', 'background', '맛있는데'], ['크다', 'background', '큰데'], ['먹다', 'honorific', '드세요'],
  ['되다', 'present', '돼요'], ['쉬다', 'present', '쉬어요'], ['배우다', 'past', '배웠어요'], ['기다리다', 'promise', '기다릴게요'],
  ['멀다', 'wow', '머네요'], ['가다', 'intend', '가려고 해요'], ['읽다', 'purpose', '읽으러 가요'], ['걷다', 'shallWe', '걸을까요?'],
];
for (const [d, form, want] of cases) {
  assert.equal(FORMS[form].make(findVerb(d))[0], want, `${d} ${form}`);
}

assert.equal(sino(15000), '만 오천');
assert.equal(sino(10000), '만');
assert.equal(sino(2026), '이천이십육');
assert.equal(sino(100000000), '일억');
assert.equal(nativeCounter(20), '스무');
assert.equal(nativeCounter(21), '스물한');
assert.equal(nativeCounter(4), '네');
assert.equal(month(6), '유월');
assert.equal(month(10), '시월');
assert.deepEqual(time(2, 30), ['두 시 삼십 분', '두 시 반']);

const r = makeRng('test');
let n = 0;
for (const t of ALL_TOPICS) {
  for (let i = 0; i < 40; i++) {
    const q = makeQuestion(t, r);
    assert.ok(q, `topic ${t.id} produced no question`);
    for (const a of q.a) assert.ok(a && !/undefined|NaN/.test(a), `bad answer in ${t.id}: ${a}`);
    assert.ok(isCorrect(q.a[0], q), `own answer rejected in ${t.id}: ${q.q} → ${q.a[0]}`);
    n++;
  }
}
for (const cat of Object.keys(NUM_CATEGORIES)) {
  for (const mode of Object.keys(NUM_MODES)) {
    for (let i = 0; i < 30; i++) {
      const q = numberQuestion(r, [cat], mode);
      assert.ok(isCorrect(q.a[0], q), `number ${cat}/${mode}: ${q.q} → ${q.a[0]}`);
      n++;
    }
  }
}
// AI output is checked before use: unknown topics, bad blanks and empty answers are dropped
const ai = acceptQuestions(['1.1', '1.1', '1.2'], [
  { topicId: '1.1', q: '저는 학생___.', cue: '이에요 or 예요?', en: "I'm a student.", a: ['이에요'], note: '' },
  { topicId: '1.1', q: '저는 ___ ___.', cue: 'two blanks', en: '', a: ['x'], note: '' },
  { topicId: '9.9', q: '___', cue: 'unknown topic', en: '', a: ['x'], note: '' },
  { topicId: '1.2', q: '', cue: 'Say: Minsu.', en: '', a: [' ', ''], note: '' },
]);
assert.equal(ai.length, 3);
assert.equal(ai[0].a[0], '이에요');
assert.equal(ai[0].topicTitle, 'NOUN이에요/예요');
assert.equal(ai[1], null);
assert.equal(ai[2], null);

console.log(`ok: ${cases.length} conjugations, numbers, ${ALL_TOPICS.length} topics, ${n} generated questions`);
