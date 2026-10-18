// Which new words you get. Every word is either in the current set, upcoming (never shown), or has a status:
//   studying: you added it to Anki — never suggested again
//   known / skip: you removed it (already know it / not useful to you) — never suggested again
// The current set refills from the upcoming words (in order of usefulness) whenever you remove one, and is
// replaced by a fresh set only when you add it to Anki — never by the calendar, so a break doesn't pile up words.
import { state, save, addPoint } from './state.js';
import { WORDS } from './data/vocab.js';
import { todayStr, daysBetween } from './rng.js';

export const PER_DAY = 5;
export const STATUS = { studying: 'Studying', known: 'Known', skip: 'Skipped' };

const byKo = new Map(WORDS.map((w, i) => [w.ko, { ...w, i }]));
export const wordInfo = (ko) => byKo.get(ko) || { ko, en: '' };

/** Carry progress over from the old "5 words per day since your start date" scheme. */
function migrate() {
  const v = { words: {}, set: null };
  const days = Math.max(0, daysBetween(state.startDate, todayStr()));
  const old = (i) => Array.from({ length: PER_DAY }, (_, k) => WORDS[(i * PER_DAY + k) % WORDS.length].ko);
  for (let i = 0; i < Math.min(days, Math.floor(WORDS.length / PER_DAY)); i++) {
    for (const ko of old(i)) v.words[ko] ||= { s: 'studying', d: state.startDate, anki: !!state.anki?.words?.[i] };
  }
  const today = old(days).filter((ko) => !v.words[ko]);
  if (state.anki?.words?.[days]) today.forEach((ko) => (v.words[ko] = { s: 'studying', d: todayStr(), anki: true }));
  else v.set = { date: todayStr(), list: today };
  return v;
}

function V() {
  if (!state.vocab) {
    state.vocab = migrate();
    save();
  }
  return state.vocab;
}

export function upcoming() {
  const v = V();
  const inSet = new Set(v.set?.list || []);
  return WORDS.filter((w) => !v.words[w.ko] && !inSet.has(w.ko));
}

function fill() {
  const v = V();
  const next = upcoming();
  while (v.set.list.length < PER_DAY && next.length) v.set.list.push(next.shift().ko);
}

/** The current set of new words (stays the same until you add it to Anki). */
export function currentSet() {
  const v = V();
  v.set ||= { date: todayStr(), list: [] };
  const before = v.set.list.join();
  fill();
  if (v.set.list.join() !== before) save();
  return v.set.list.map(wordInfo);
}

export function setStatus(ko, s) {
  const v = V();
  const prev = v.words[ko];
  v.words[ko] = { s, d: todayStr(), anki: !!prev?.anki };
  if (v.set) v.set.list = v.set.list.filter((k) => k !== ko);
  currentSet();
  save();
}

/** Back to the upcoming words. */
export function restore(ko) {
  delete V().words[ko];
  save();
}

/** Today's set went to Anki: those words are now being studied, and a fresh set takes their place. */
export function setSentToAnki() {
  const v = V();
  for (const ko of v.set.list) v.words[ko] = { s: 'studying', d: todayStr(), anki: true };
  v.set.list = [];
  currentSet();
  addPoint('vocab');
}

export function markSent(kos) {
  const v = V();
  kos.forEach((ko) => v.words[ko] && (v.words[ko].anki = true));
  save();
}

/** Words with a status, newest first. */
export function wordsWith(s) {
  return Object.entries(V().words).filter(([, w]) => w.s === s)
    .sort(([ka, a], [kb, b]) => b.d.localeCompare(a.d) || wordInfo(ka).i - wordInfo(kb).i)
    .map(([ko, w]) => ({ ...wordInfo(ko), ...w }));
}
