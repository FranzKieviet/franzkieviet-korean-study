import { h, toast } from '../dom.js';
import { state, save } from '../state.js';
import { todayStr, daysBetween, makeRng } from '../rng.js';
import { WORDS, HANJA } from '../data/vocab.js';
import { speakButton } from '../tts.js';
import { addCards, downloadAnkiFile, wordCard, hanjaCard } from '../anki.js';
import { runQuiz } from '../quiz.js';

export const PER_DAY = 5;

export function dayIndex() {
  return Math.max(0, daysBetween(state.startDate, todayStr()));
}

export function wordsForDay(i) {
  return Array.from({ length: PER_DAY }, (_, k) => WORDS[(i * PER_DAY + k) % WORDS.length]);
}

function parseDate(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Hanja set index: starts at 0 on your first day, +1 every Sunday after that. */
export function weekIndex() {
  const days = dayIndex();
  const startDow = parseDate(state.startDate).getDay();
  let sundays = 0;
  for (let k = 1; k <= days; k++) if ((startDow + k) % 7 === 0) sundays++;
  return sundays;
}

export function hanjaForWeek(i) {
  return Array.from({ length: 5 }, (_, k) => HANJA[(i * 5 + k) % HANJA.length]);
}

export const isSunday = () => new Date().getDay() === 0;

export function wordList(words) {
  return h('ul', { class: 'word-list' }, ...words.map((w) => h('li', {},
    h('span', { class: 'ko word' }, w.ko), speakButton(w.ko), h('span', { class: 'en' }, w.en))));
}

export function hanjaList(list) {
  return h('div', { class: 'hanja-grid' }, ...list.map((x) => h('div', { class: 'hanja-card' },
    h('div', { class: 'hanja' }, x.h),
    h('div', { class: 'ko' }, x.hun, ' ', speakButton(x.hun)),
    h('div', { class: 'en small' }, x.en),
    h('ul', { class: 'small hanja-ex' }, ...x.ex.map((e) => h('li', {}, e))))));
}

async function sendToAnki(kind, indexes, btn) {
  const isWords = kind === 'words';
  const deck = isWords ? state.settings.deckWords : state.settings.deckHanja;
  const cards = indexes.flatMap((i) => (isWords ? wordsForDay(i).map((w) => wordCard(w, i)) : hanjaForWeek(i).map((x) => hanjaCard(x, i))));
  btn.disabled = true;
  const old = btn.textContent;
  btn.textContent = 'Sending…';
  try {
    const { added, skipped } = await addCards(deck, cards);
    indexes.forEach((i) => (state.anki[kind][i] = true));
    save();
    toast(`Added ${added} card${added === 1 ? '' : 's'} to "${deck}"${skipped ? ` (${skipped} already there)` : ''}.`, 'good');
    btn.textContent = '✓ In Anki';
  } catch (e) {
    console.warn(e);
    toast('Could not reach Anki. Is Anki open with AnkiConnect installed? See Settings → Anki. You can download the file instead.', 'bad');
    btn.textContent = old;
    btn.disabled = false;
  }
}

export function ankiButtons(kind, indexes, label) {
  const sent = indexes.every((i) => state.anki[kind][i]);
  const send = h('button', { class: 'btn primary small' }, sent ? '✓ In Anki' : `Add ${label} to Anki`);
  send.addEventListener('click', () => sendToAnki(kind, indexes, send));
  const dl = h('button', { class: 'btn small', title: 'Download a file for Anki → File → Import' }, 'Download for Anki');
  dl.addEventListener('click', () => {
    const isWords = kind === 'words';
    const cards = indexes.flatMap((i) => (isWords ? wordsForDay(i).map((w) => wordCard(w, i)) : hanjaForWeek(i).map((x) => hanjaCard(x, i))));
    downloadAnkiFile(`korean-${kind}-${todayStr()}.txt`, isWords ? state.settings.deckWords : state.settings.deckHanja, cards);
  });
  return h('div', { class: 'row-actions' }, send, dl);
}

export function renderWords(main) {
  const di = dayIndex();
  const wi = weekIndex();
  const unsentDays = Array.from({ length: di + 1 }, (_, i) => i).filter((i) => !state.anki.words[i]);
  const unsentWeeks = Array.from({ length: wi + 1 }, (_, i) => i).filter((i) => !state.anki.hanja[i]);
  const learnedWords = Array.from({ length: di + 1 }, (_, i) => wordsForDay(i)).flat();

  const quizArea = h('div');

  function startQuiz(mode) {
    const r = makeRng();
    const pool = r.shuffle(learnedWords).slice(0, 20);
    const questions = pool.map((w) => (mode === 'type'
      ? { q: '', cue: `In Korean: ${w.en}`, a: [w.ko], speak: w.ko, topicTitle: 'Words' }
      : { q: w.ko, cue: 'What does it mean? Say it, then reveal.', a: [w.en], speak: w.ko, self: true, topicTitle: 'Words' }));
    runQuiz(quizArea, { questions, onExit: () => renderWords(main) });
    quizArea.scrollIntoView({ behavior: 'smooth' });
  }

  main.replaceChildren(
    h('header', { class: 'page-head' }, h('h1', {}, 'Words & Hanja'),
      h('p', { class: 'muted' }, `Day ${di + 1} · 5 new words every day, 5 new hanja every Sunday.`)),
    h('section', { class: 'card' },
      h('h2', {}, "Today's words"),
      wordList(wordsForDay(di)),
      ankiButtons('words', [di], "today's words"),
      unsentDays.length > 1 ? h('div', { class: 'small muted top-gap' }, `${unsentDays.length} days not sent to Anki yet. `,
        (() => { const b = h('button', { class: 'btn ghost small' }, 'Send all'); b.addEventListener('click', () => sendToAnki('words', unsentDays, b)); return b; })()) : ''),
    h('section', { class: 'card' },
      h('h2', {}, 'This week’s hanja ', isSunday() ? h('span', { class: 'badge' }, 'New today!') : ''),
      hanjaList(hanjaForWeek(wi)),
      ankiButtons('hanja', [wi], "this week's hanja"),
      unsentWeeks.length > 1 ? h('div', { class: 'small muted top-gap' }, `${unsentWeeks.length} weeks not sent to Anki yet. `,
        (() => { const b = h('button', { class: 'btn ghost small' }, 'Send all'); b.addEventListener('click', () => sendToAnki('hanja', unsentWeeks, b)); return b; })()) : ''),
    h('section', { class: 'card' },
      h('h2', {}, 'Review words so far'),
      h('p', { class: 'muted small' }, `${learnedWords.length} words so far.`),
      h('div', { class: 'row-actions' },
        h('button', { class: 'btn primary', onclick: () => startQuiz('type') }, 'English → type Korean'),
        h('button', { class: 'btn', onclick: () => startQuiz('cards') }, 'Korean → meaning (flashcards)')),
      quizArea),
    h('details', { class: 'card' },
      h('summary', {}, 'All words so far'),
      ...Array.from({ length: di + 1 }, (_, i) => di - i).map((i) => h('div', { class: 'day-block' },
        h('h3', {}, `Day ${i + 1}`), wordList(wordsForDay(i))))),
  );
}
