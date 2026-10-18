// Anki integration via the AnkiConnect add-on, with a downloadable import file as fallback.
import { state } from './state.js';
import { partsOf } from './data/hanja-gloss.js';

async function invoke(action, params = {}) {
  // A plain string body keeps this a "simple" CORS request (no preflight).
  const res = await fetch(state.settings.ankiUrl, {
    method: 'POST',
    body: JSON.stringify({ action, version: 6, params }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json.result;
}

export async function ankiVersion() {
  return invoke('version');
}

// Word cards use the app's own note types: English on the front, type the Korean, Korean read aloud.
// Korean is the first field because Anki checks duplicates on it (벌써 and 이미 both mean "already").
const CARD_CSS = `.card {
    font-family: arial;
    font-size: 20px;
    line-height: 1.5;
    text-align: center;
    color: black;
    background-color: white;
}`;

const EN_KO = {
  Name: 'English → Korean',
  Front: '{{English}}\n\n{{type:Korean}}',
  Back: '{{English}}\n\n<hr id=answer>\n\n{{type:Korean}} {{Korean}}\n\n{{tts ko_KR:Korean}}',
};
const KO_EN = {
  Name: 'Korean → English',
  Front: '{{Korean}}\n\n{{tts ko_KR:Korean}}',
  Back: '{{FrontSide}}\n\n<hr id=answer>\n\n{{English}}',
};

export const WORD_CARD_STYLES = {
  enko: { label: 'English → type Korean', model: 'Korean Study · English → Korean', templates: [EN_KO] },
  both: { label: 'Both ways: English → type Korean, and Korean → English', model: 'Korean Study · English ⇄ Korean', templates: [EN_KO, KO_EN] },
  custom: { label: 'My own note type (set below)' },
};
export const CARD_TEMPLATES = { css: CARD_CSS, enko: EN_KO, koen: KO_EN };

const wordStyle = () => WORD_CARD_STYLES[state.settings.wordCards] || WORD_CARD_STYLES.enko;

async function ensureModel(style) {
  if (!style.model) return;
  const names = await invoke('modelNames');
  if (names.includes(style.model)) return;
  await invoke('createModel', {
    modelName: style.model, inOrderFields: ['Korean', 'English'], css: CARD_CSS, isCloze: false, cardTemplates: style.templates,
  });
}

/** Create the app's word note types in Anki (both, so switching later just works). */
export async function setUpNoteTypes() {
  await ensureModel(WORD_CARD_STYLES.enko);
  await ensureModel(WORD_CARD_STYLES.both);
}

/** Note type + fields: word cards ({ ko, en }) use the chosen word card style, everything else the custom note type. */
function noteFor(c) {
  const style = wordStyle();
  if (c.ko && style.model) return { modelName: style.model, fields: { Korean: c.ko, English: c.en } };
  return { modelName: state.settings.noteType, fields: { Front: c.front, Back: c.back } };
}

/**
 * cards: word cards { ko, en, front, back, tags } or other cards { front, back, tags }
 * Returns { added, skipped } — duplicates already in the deck are skipped.
 */
export async function addCards(deck, cards) {
  await invoke('createDeck', { deck });
  if (cards.some((c) => c.ko)) await ensureModel(wordStyle());
  const notes = cards.map((c) => ({
    deckName: deck,
    ...noteFor(c),
    tags: ['korean-study', ...(c.tags || [])],
    options: { allowDuplicate: false, duplicateScope: 'deck' },
  }));
  const can = await invoke('canAddNotes', { notes });
  const toAdd = notes.filter((_, i) => can[i]);
  if (toAdd.length) await invoke('addNotes', { notes: toAdd });
  return { added: toAdd.length, skipped: notes.length - toAdd.length };
}

/** Download a tab-separated file Anki can import (File → Import). The note type must already exist in Anki. */
export function downloadAnkiFile(filename, deck, cards) {
  const esc = (s) => String(s).replace(/\t/g, ' ').replace(/\n/g, '<br>');
  const notes = cards.map((c) => ({ ...noteFor(c), tags: ['korean-study', ...(c.tags || [])] }));
  const lines = [
    '#separator:tab',
    '#html:true',
    `#deck:${deck}`,
    `#notetype:${notes[0]?.modelName || state.settings.noteType}`,
    '#tags column:3',
    ...notes.map((n) => [...Object.values(n.fields).map(esc), n.tags.join(' ')].join('\t')),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/** A vocab card: Korean word + English meaning (front/back are used with a custom note type). */
export const wordCard = (w, tags = []) => ({ ko: w.ko, en: w.en || '?', front: w.ko, back: w.en || '?', tags });

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Hanja syllable card, no Chinese characters: the front shows the syllable in its two sample words (which also keeps
 * fronts unique, since 화 can be fire, talk, change or flower); the back gives the meaning and the word breakdowns.
 */
export const hanjaCard = (x, week) => ({
  front: `<b>${x.syl}</b><br>${x.words.map((w) => w.ko).join(' · ')}`,
  back: `<b>${x.syl}</b> = ${x.en.split(';').map((m) => cap(m.trim())).join(', ')}<br><br>`
    + x.words.map((w) => `${w.ko}: ${partsOf(w.ko, w.hj).map((p) => (p.ch === x.h ? `<b>${cap(p.gloss)}</b>` : cap(p.gloss))).join(' + ')} = ${cap(w.en)}`).join('<br>'),
  tags: [`hanja-week-${week + 1}`],
});
