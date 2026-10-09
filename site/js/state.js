// Progress lives in localStorage (per browser). Export/import in Settings moves it between devices.
import { todayStr, daysBetween } from './rng.js';

const KEY = 'korean-study-v1';

const DEFAULTS = () => ({
  learned: {}, // topicId -> true
  stats: {}, // topicId -> { c: correct, w: wrong, last: date }
  startDate: todayStr(),
  daily: {}, // date -> { questions, results, done }
  streak: { last: null, count: 0 },
  anki: { words: {}, hanja: {} }, // dayIndex/weekIndex -> true when sent
  best: {}, // drill key -> best score
  settings: {
    dailyCount: 15,
    aiQuestions: true, // used only once a Gemini API key is saved
    ttsRate: 0.9,
    voice: '',
    autoSpeak: true,
    ankiUrl: 'http://127.0.0.1:8765',
    deckWords: 'Korean::Daily words',
    deckHanja: 'Korean::Hanja',
    noteType: 'Basic (and reversed card)',
  },
});

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS();
    const s = JSON.parse(raw);
    const d = DEFAULTS();
    return { ...d, ...s, settings: { ...d.settings, ...(s.settings || {}) }, anki: { ...d.anki, ...(s.anki || {}) } };
  } catch {
    return DEFAULTS();
  }
}

export const state = load();

export function save() {
  try {
    // keep only the last 30 days of daily sets
    const dates = Object.keys(state.daily).sort();
    for (const d of dates.slice(0, -30)) delete state.daily[d];
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('save failed', e);
  }
}

export function recordResult(topicId, ok) {
  if (!topicId) return;
  const s = (state.stats[topicId] ||= { c: 0, w: 0 });
  ok ? s.c++ : s.w++;
  s.last = todayStr();
  save();
}

/** "I was right" — turn a recorded wrong answer into a correct one. */
export function overrideResult(topicId) {
  const s = state.stats[topicId];
  if (!s || s.w < 1) return;
  s.w--;
  s.c++;
  save();
}

export function accuracy(topicId) {
  const s = state.stats[topicId];
  if (!s || s.c + s.w === 0) return null;
  return s.c / (s.c + s.w);
}

export function markDailyDone() {
  const today = todayStr();
  if (state.streak.last === today) return;
  const gap = state.streak.last ? daysBetween(state.streak.last, today) : null;
  state.streak.count = gap === 1 ? state.streak.count + 1 : 1;
  state.streak.last = today;
  save();
}

export function currentStreak() {
  if (!state.streak.last) return 0;
  const gap = daysBetween(state.streak.last, todayStr());
  return gap <= 1 ? state.streak.count : 0;
}

export function exportState() {
  return JSON.stringify(state, null, 2);
}

export function importState(json) {
  const s = JSON.parse(json);
  if (typeof s !== 'object' || !s.settings) throw new Error('Not a Korean Study backup file');
  Object.keys(state).forEach((k) => delete state[k]);
  Object.assign(state, DEFAULTS(), s);
  save();
}

export function resetState() {
  localStorage.removeItem(KEY);
  location.reload();
}
