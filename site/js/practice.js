// Builds question sets for the daily review, grammar practice, verb drills and number drills.
import { topicById, makeQuestion } from './data/grammar.js';
import { FORMS } from './hangul.js';
import { VERBS, ADJECTIVES, ALL_VERBS, irrNote } from './data/words.js';
import { NUM_CATEGORIES } from './numbers.js';
import { state } from './state.js';

/** Weight weak and rarely-practiced topics higher. */
function topicWeight(id) {
  const s = state.stats[id];
  if (!s) return 3; // never practiced
  const n = s.c + s.w;
  const err = s.w / Math.max(1, n);
  return 1 + err * 4 + (n < 5 ? 1.5 : 0);
}

export function grammarQuestions(topicIds, count, r) {
  const topics = topicIds.map(topicById).filter(Boolean);
  if (!topics.length) return [];
  const out = [];
  const seen = new Set();
  const perTopic = {};
  let guard = 0;
  while (out.length < count && guard++ < count * 20) {
    // keep variety: don't let one topic dominate
    const cap = Math.max(2, Math.ceil(count / topics.length) + 1);
    const pool = topics.filter((t) => (perTopic[t.id] || 0) < cap);
    const t = r.weighted((pool.length ? pool : topics).map((x) => [x, topicWeight(x.id)]));
    const q = makeQuestion(t, r);
    if (!q) continue;
    const key = q.q + q.cue + q.a[0];
    if (seen.has(key) && guard < count * 15) continue;
    seen.add(key);
    perTopic[t.id] = (perTopic[t.id] || 0) + 1;
    out.push(q);
  }
  return out;
}

/** Choose `count` topic ids (repeats allowed), weak topics more often, no topic dominating. */
export function pickTopics(topicIds, count, r) {
  const topics = topicIds.map(topicById).filter(Boolean);
  if (!topics.length) return [];
  const cap = Math.max(2, Math.ceil(count / topics.length) + 1);
  const perTopic = {};
  const out = [];
  while (out.length < count) {
    const pool = topics.filter((t) => (perTopic[t.id] || 0) < cap);
    const t = r.weighted((pool.length ? pool : topics).map((x) => [x, topicWeight(x.id)]));
    perTopic[t.id] = (perTopic[t.id] || 0) + 1;
    out.push(t.id);
  }
  return out;
}

export function verbPool(kind) {
  switch (kind) {
    case 'verbs': return VERBS;
    case 'adjectives': return ADJECTIVES;
    case 'irregular': return ALL_VERBS.filter((v) => irrNote(v) && !irrNote(v).startsWith('하다'));
    default: return ALL_VERBS;
  }
}

export function verbQuestion(r, pool, formKeys) {
  for (let i = 0; i < 30; i++) {
    const key = r.pick(formKeys);
    const f = FORMS[key];
    const v = r.pick(pool);
    if (f.verbOnly && v.t !== 'v') continue;
    if (f.adjOnly && v.t !== 'a') continue;
    return { q: v.d, cue: f.label, en: v.en, a: f.make(v), note: irrNote(v), topicTitle: 'Verb drill', placeholder: 'Conjugate…' };
  }
  return { q: '가다', cue: FORMS.present.label, en: 'to go', a: ['가요'], topicTitle: 'Verb drill' };
}

/** Forms whose lesson the user has (at least partly) learned. */
export function learnedForms() {
  const lessons = new Set(Object.keys(state.learned).filter((k) => state.learned[k]).map((id) => +id.split('.')[0]));
  const keys = Object.entries(FORMS).filter(([, f]) => lessons.has(f.lesson)).map(([k]) => k);
  return keys.length ? keys : ['present', 'past', 'honorific'];
}

export const NUM_MODES = {
  read: { label: 'Read it', desc: 'See the number → type it in Korean' },
  listen: { label: 'Listen', desc: 'Hear Korean → type the number' },
  write: { label: 'Hangul → number', desc: 'Read Korean → type the number' },
  say: { label: 'Say it aloud', desc: 'See it → say it fast → reveal & check yourself' },
};

export function numberQuestion(r, cats, mode) {
  const key = r.pick(cats);
  const cat = NUM_CATEGORIES[key];
  const it = cat.gen(r);
  const base = { topicTitle: cat.label, note: cat.note };
  const numHint = it.numLabel ? `Type the ${it.numLabel}` : 'Type the number (digits)';
  switch (mode) {
    case 'listen':
      return { ...base, q: '', audio: it.speak, cue: `Listen · ${numHint}`, a: it.num, speak: it.speak, inputLang: 'en', placeholder: it.numLabel || 'digits', reveal: it.show };
    case 'write':
      return { ...base, q: it.ko[0], cue: numHint, a: it.num, speak: it.speak, inputLang: 'en', placeholder: it.numLabel || 'digits', en: '' };
    case 'say':
      return { ...base, q: it.show, cue: 'Say it out loud — fast!', a: it.ko, speak: it.speak, self: true, en: it.en || '' };
    default:
      return { ...base, q: it.show, cue: 'Write it in Korean (hangul)', a: it.ko, speak: it.speak, en: it.en || '' };
  }
}
