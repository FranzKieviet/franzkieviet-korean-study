import { h, toast } from '../dom.js';
import { state, save, removeWord, wordsToReview, KNOWN_AFTER } from '../state.js';
import { todayStr, daysBetween, makeRng } from '../rng.js';
import { HANJA } from '../data/vocab.js';
import { speakButton } from '../tts.js';
import { addCards, downloadAnkiFile, hanjaCard } from '../anki.js';
import { runQuiz } from '../quiz.js';
import { currentSet, setStatus, restore, setSentToAnki, markSent, upcoming, wordsWith, STATUS } from '../vocab-plan.js';

export function dayIndex() {
  return Math.max(0, daysBetween(state.startDate, todayStr()));
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

export function hanjaList(list) {
  return h('div', { class: 'hanja-grid' }, ...list.map((x) => h('div', { class: 'hanja-card' },
    h('div', { class: 'hanja' }, x.h),
    h('div', { class: 'ko' }, x.hun, ' ', speakButton(x.hun)),
    h('div', { class: 'en small' }, x.en),
    h('ul', { class: 'small hanja-ex' }, ...x.ex.map((e) => h('li', {}, e))))));
}

const wordCard = (w) => ({ front: w.ko, back: w.en, tags: ['daily-word', `added-${todayStr()}`] });
const ANKI_DOWN = 'Could not reach Anki. Is Anki open with AnkiConnect installed? See Settings → Anki. You can download the file instead.';

/** Send cards; returns true when Anki took them. */
async function sendCards(deck, cards, btn) {
  btn.disabled = true;
  const old = btn.textContent;
  btn.textContent = 'Sending…';
  try {
    const { added, skipped } = await addCards(deck, cards);
    toast(`Added ${added} card${added === 1 ? '' : 's'} to "${deck}"${skipped ? ` (${skipped} already there)` : ''}.`, 'good');
    return true;
  } catch (e) {
    console.warn(e);
    toast(ANKI_DOWN, 'bad');
    btn.textContent = old;
    btn.disabled = false;
    return false;
  }
}

/** Hanja: one set per week. */
export function ankiButtons(indexes, label) {
  const sent = indexes.every((i) => state.anki.hanja[i]);
  const send = h('button', { class: 'btn primary small' }, sent ? '✓ In Anki' : `Add ${label} to Anki`);
  const cards = () => indexes.flatMap((i) => hanjaForWeek(i).map((x) => hanjaCard(x, i)));
  send.addEventListener('click', async () => {
    if (!(await sendCards(state.settings.deckHanja, cards(), send))) return;
    indexes.forEach((i) => (state.anki.hanja[i] = true));
    save();
    send.textContent = '✓ In Anki';
  });
  const dl = h('button', { class: 'btn small', title: 'Download a file for Anki → File → Import' }, 'Download for Anki');
  dl.addEventListener('click', () => downloadAnkiFile(`korean-hanja-${todayStr()}.txt`, state.settings.deckHanja, cards()));
  return h('div', { class: 'row-actions' }, send, dl);
}

/**
 * The current set of new words, each with "I know it" / "Skip" (a new word takes its place).
 * Adding them to Anki moves them to "studying" and brings a fresh set. onChange re-renders the page.
 */
export function todaysWordsCard(onChange) {
  const set = currentSet();
  const unsent = wordsWith('studying').filter((w) => !w.anki);
  const remove = (ko, s) => { setStatus(ko, s); onChange(); };

  const send = h('button', { class: 'btn primary small' }, 'Add to Anki → new words');
  send.addEventListener('click', async () => {
    if (!(await sendCards(state.settings.deckWords, set.map(wordCard), send))) return;
    setSentToAnki();
    onChange();
  });
  const dl = h('button', { class: 'btn small', title: 'Download a file for Anki → File → Import, then get new words' }, 'Download for Anki → new words');
  dl.addEventListener('click', () => {
    downloadAnkiFile(`korean-words-${todayStr()}.txt`, state.settings.deckWords, set.map(wordCard));
    setSentToAnki();
    onChange();
  });
  const sendOld = h('button', { class: 'btn ghost small' }, 'Send them too');
  sendOld.addEventListener('click', async () => {
    if (!(await sendCards(state.settings.deckWords, unsent.map(wordCard), sendOld))) return;
    markSent(unsent.map((w) => w.ko));
    onChange();
  });

  return h('section', { class: 'card' },
    h('h2', {}, 'New words'),
    set.length
      ? h('ul', { class: 'word-list' }, ...set.map((w) => h('li', {},
        h('span', { class: 'ko word' }, w.ko), speakButton(w.ko), h('span', { class: 'en' }, w.en),
        h('span', { class: 'spacer' }),
        h('span', { class: 'word-actions' },
          h('button', { class: 'btn ghost small', title: 'I already know this word', onclick: () => remove(w.ko, 'known') }, 'I know it'),
          h('button', { class: 'btn ghost small', title: 'Not useful for me', onclick: () => remove(w.ko, 'skip') }, 'Skip')))))
      : h('p', { class: 'muted' }, 'You have gone through every word in the list. 대단해요!'),
    set.length ? h('p', { class: 'muted small' }, 'Remove words you know or don’t need and a new one takes their place. You get a fresh set when you add these to Anki, so take breaks whenever you like: nothing piles up.') : '',
    set.length ? h('div', { class: 'row-actions' }, send, dl) : '',
    unsent.length ? h('div', { class: 'small muted top-gap' }, `${unsent.length} word${unsent.length === 1 ? '' : 's'} you're studying ${unsent.length === 1 ? "isn't" : "aren't"} in Anki yet. `, sendOld) : '');
}

/** Browse every word by status: remove upcoming ones you know or don't need, or bring removed ones back. */
function browseSection(main) {
  const tabs = { upcoming: 'Upcoming', studying: STATUS.studying, known: STATUS.known, skip: STATUS.skip };
  let tab = 'upcoming';
  let query = '';
  const list = h('ul', { class: 'word-list browse-list' });
  const tabBar = h('div', { class: 'chips' });
  const search = h('input', { type: 'search', class: 'browse-search', placeholder: 'Search Korean or English…', 'aria-label': 'Search words' });
  search.addEventListener('input', () => { query = search.value.trim().toLowerCase(); paint(); });

  const items = (t) => (t === 'upcoming' ? upcoming() : wordsWith(t));
  const act = (label, title, fn) => h('button', { class: 'btn ghost small', title, onclick: () => { fn(); paint(); } }, label);

  function paint() {
    tabBar.replaceChildren(...Object.entries(tabs).map(([k, label]) => h('button', {
      class: `chip-check${k === tab ? ' on' : ''}`, 'aria-pressed': String(k === tab), onclick: () => { tab = k; paint(); },
    }, `${label} (${items(k).length})`)));
    const all = items(tab).filter((w) => !query || w.ko.includes(query) || w.en.toLowerCase().includes(query));
    const shown = all.slice(0, 300);
    list.replaceChildren(
      ...shown.map((w) => h('li', {},
        h('span', { class: 'ko word' }, w.ko), speakButton(w.ko), h('span', { class: 'en' }, w.en),
        h('span', { class: 'spacer' }),
        h('span', { class: 'word-actions' },
          tab === 'upcoming' || tab === 'studying'
            ? [act('I know it', 'I already know this word', () => setStatus(w.ko, 'known')), act('Skip', 'Not useful for me', () => setStatus(w.ko, 'skip'))]
            : [act(tab === 'known' ? 'Not known' : 'Unskip', 'Put it back in the upcoming words', () => restore(w.ko))]))),
      all.length > shown.length ? h('li', { class: 'muted small' }, `…and ${all.length - shown.length} more. Search to narrow it down.`) : '',
      !all.length ? h('li', { class: 'muted small' }, query ? 'No matches.' : 'Nothing here yet.') : '');
  }
  paint();

  const details = h('details', { class: 'card' },
    h('summary', {}, 'Browse all words'),
    h('p', { class: 'muted small' }, 'Upcoming words come next in your sets, most useful first. Mark the ones you already know or don’t need and they’ll never be suggested. Words you’ve added to Anki are under Studying.'),
    tabBar, search, list);
  // removing an upcoming word can change today's set, so refresh the page when the browser is closed
  details.addEventListener('toggle', () => { if (!details.open) renderWords(main); });
  return details;
}

/** A quiz question for a word saved from a question (no meaning saved → say-it flashcard). */
export function savedWordQuestion(w) {
  return w.en
    ? { q: '', cue: `In Korean: ${w.en}`, a: [w.ko], speak: w.ko, topicTitle: 'My words', savedWord: w.ko, noTap: true }
    : { q: w.ko, cue: 'Do you remember what it means? Say it, then reveal.', a: [w.ko], speak: w.ko, self: true, topicTitle: 'My words', savedWord: w.ko };
}

function savedSection(main) {
  const all = Object.entries(state.myWords).map(([ko, w]) => ({ ko, ...w })).sort((a, b) => b.added.localeCompare(a.added));
  const area = h('div');
  const cards = () => all.map((w) => ({ front: w.ko, back: w.en || '?', tags: ['saved-word'] }));

  function practice() {
    const r = makeRng();
    const learning = wordsToReview();
    const pool = (learning.length ? learning : all).slice(0, 20);
    runQuiz(area, { questions: r.shuffle(pool).map(savedWordQuestion), onExit: () => renderWords(main) });
    area.scrollIntoView({ behavior: 'smooth' });
  }

  async function send(btn) {
    btn.disabled = true;
    try {
      const { added, skipped } = await addCards(state.settings.deckWords, cards());
      toast(`Added ${added} card${added === 1 ? '' : 's'} to "${state.settings.deckWords}"${skipped ? ` (${skipped} already there)` : ''}.`, 'good');
    } catch {
      toast('Could not reach Anki. Is Anki open with AnkiConnect installed? See Settings → Anki. You can download the file instead.', 'bad');
    }
    btn.disabled = false;
  }

  return h('section', { class: 'card', id: 'my-words' },
    h('h2', {}, 'My saved words ', all.length ? h('span', { class: 'pill' }, String(all.length)) : ''),
    h('p', { class: 'muted small' }, all.length
      ? `Words you tapped and saved in questions. A few show up in each daily review until you get them right ${KNOWN_AFTER} times in a row.`
      : 'Nothing saved yet. While practicing, tap any word in a question (Korean or English) to see what it means and save it here for review.'),
    all.length ? h('ul', { class: 'word-list' }, ...all.map((w) => h('li', {},
      h('span', { class: 'ko word' }, w.ko), speakButton(w.ko), h('span', { class: 'en' }, w.en || '—'),
      h('span', { class: 'spacer' }),
      h('span', { class: `acc ${(w.ok || 0) >= KNOWN_AFTER ? 'good' : 'none'}`, title: `${w.ok || 0} right in a row` }, (w.ok || 0) >= KNOWN_AFTER ? 'known' : `${w.ok || 0}/${KNOWN_AFTER}`),
      h('button', { class: 'btn ghost small', title: 'Remove', 'aria-label': `Remove ${w.ko}`, onclick: () => { removeWord(w.ko); renderWords(main); } }, '✕')))) : '',
    all.length ? h('div', { class: 'row-actions top-gap' },
      h('button', { class: 'btn primary', onclick: practice }, 'Practice saved words'),
      h('button', { class: 'btn small', onclick: (e) => send(e.currentTarget) }, 'Add to Anki'),
      h('button', { class: 'btn small', onclick: () => downloadAnkiFile(`korean-saved-words-${todayStr()}.txt`, state.settings.deckWords, cards()) }, 'Download for Anki')) : '',
    area);
}

export function renderWords(main) {
  const wi = weekIndex();
  const unsentWeeks = Array.from({ length: wi + 1 }, (_, i) => i).filter((i) => !state.anki.hanja[i]);
  const studyWords = [...currentSet(), ...wordsWith('studying')];

  const quizArea = h('div');

  function startQuiz(mode) {
    const r = makeRng();
    const pool = r.shuffle(studyWords).slice(0, 20);
    const questions = pool.map((w) => (mode === 'type'
      ? { q: '', cue: `In Korean: ${w.en}`, a: [w.ko], speak: w.ko, topicTitle: 'Words', noTap: true }
      : { q: w.ko, cue: 'What does it mean? Say it, then reveal.', a: [w.en], speak: w.ko, self: true, topicTitle: 'Words' }));
    runQuiz(quizArea, { questions, onExit: () => renderWords(main) });
    quizArea.scrollIntoView({ behavior: 'smooth' });
  }

  const sendWeeks = h('button', { class: 'btn ghost small' }, 'Send all');
  sendWeeks.addEventListener('click', async () => {
    const cards = unsentWeeks.flatMap((i) => hanjaForWeek(i).map((x) => hanjaCard(x, i)));
    if (!(await sendCards(state.settings.deckHanja, cards, sendWeeks))) return;
    unsentWeeks.forEach((i) => (state.anki.hanja[i] = true));
    save();
    renderWords(main);
  });

  main.replaceChildren(
    h('header', { class: 'page-head' }, h('h1', {}, 'Words & Hanja'),
      h('p', { class: 'muted' }, `5 new words each time you add a set to Anki, 5 new hanja every Sunday. You're studying ${wordsWith('studying').length} words.`)),
    todaysWordsCard(() => renderWords(main)),
    savedSection(main),
    h('section', { class: 'card' },
      h('h2', {}, 'This week’s hanja ', isSunday() ? h('span', { class: 'badge' }, 'New today!') : ''),
      hanjaList(hanjaForWeek(wi)),
      ankiButtons([wi], "this week's hanja"),
      unsentWeeks.length > 1 ? h('div', { class: 'small muted top-gap' }, `${unsentWeeks.length} weeks not sent to Anki yet. `, sendWeeks) : ''),
    h('section', { class: 'card' },
      h('h2', {}, 'Review your words'),
      h('p', { class: 'muted small' }, `${studyWords.length} words: your new set plus the ones you're studying.`),
      h('div', { class: 'row-actions' },
        h('button', { class: 'btn primary', onclick: () => startQuiz('type') }, 'English → type Korean'),
        h('button', { class: 'btn', onclick: () => startQuiz('cards') }, 'Korean → meaning (flashcards)')),
      quizArea),
    browseSection(main),
  );
}
