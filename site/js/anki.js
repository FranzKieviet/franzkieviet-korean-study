// Anki integration via the AnkiConnect add-on (Anki desktop), or an .apkg file to open in any Anki app (phones).
import { state } from './state.js';
import { buildApkg, loadSql } from './apkg.js';

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

// ids are fixed so importing an .apkg again reuses the same note type in Anki.
export const WORD_CARD_STYLES = {
  enko: { label: 'English → type Korean', model: 'Korean Study · English → Korean', id: 1761955200001, templates: [EN_KO] },
  both: { label: 'Both ways: English → type Korean, and Korean → English', model: 'Korean Study · English ⇄ Korean', id: 1761955200002, templates: [EN_KO, KO_EN] },
  custom: { label: 'My own note type (set below)' },
};
// .apkg files can't use your own note type (the file has to bring its note types along), so
// "My own note type" word cards get a basic Front/Back one there.
const BASIC = { model: 'Korean Study · Basic', id: 1761955200003, fields: ['Front', 'Back'],
  templates: [{ Name: 'Card 1', Front: '{{Front}}', Back: '{{FrontSide}}\n\n<hr id=answer>\n\n{{Back}}' }] };
export const CARD_TEMPLATES = { css: CARD_CSS, enko: EN_KO, koen: KO_EN };

const wordStyle = () => WORD_CARD_STYLES[state.settings.wordCards] || WORD_CARD_STYLES.enko;

/**
 * The style's note type in Anki, created if missing; returns its name. An .apkg file brings the note type with a
 * fixed id (renamed "…+" if AnkiConnect made one of the same name first), so prefer that one: then cards added
 * on a phone and on a computer share a note type from then on.
 */
async function ensureModel(style) {
  if (!style.model) return undefined;
  const ids = await invoke('modelNamesAndIds');
  const fromFile = Object.keys(ids).find((name) => ids[name] === style.id);
  if (fromFile) return fromFile;
  if (!(style.model in ids)) {
    await invoke('createModel', {
      modelName: style.model, inOrderFields: ['Korean', 'English'], css: CARD_CSS, isCloze: false, cardTemplates: style.templates,
    });
  }
  return style.model;
}

/** Create the app's word note types in Anki (both, so switching later just works). */
export async function setUpNoteTypes() {
  await ensureModel(WORD_CARD_STYLES.enko);
  await ensureModel(WORD_CARD_STYLES.both);
}

/** Note type + fields: word cards ({ ko, en }) use the chosen word card style, everything else the custom note type. */
function noteFor(c, wordModel) {
  if (c.ko && wordModel) return { modelName: wordModel, fields: { Korean: c.ko, English: c.en } };
  return { modelName: state.settings.noteType, fields: { Front: c.front, Back: c.back } };
}

/**
 * cards: word cards { ko, en, front, back, tags } or other cards { front, back, tags }
 * Returns { added, skipped } — duplicates already in the deck are skipped.
 */
export async function addCards(deck, cards) {
  await invoke('createDeck', { deck });
  const wordModel = cards.some((c) => c.ko) ? await ensureModel(wordStyle()) : undefined;
  const notes = cards.map((c) => ({
    deckName: deck,
    ...noteFor(c, wordModel),
    tags: ['korean-study', ...(c.tags || [])],
    options: { allowDuplicate: false, duplicateScope: 'deck' },
  }));
  const can = await invoke('canAddNotes', { notes });
  const toAdd = notes.filter((_, i) => can[i]);
  if (toAdd.length) await invoke('addNotes', { notes: toAdd });
  return { added: toAdd.length, skipped: notes.length - toAdd.length };
}

/** Note type + fields for an .apkg file. */
function fileNoteFor(c) {
  const style = wordStyle();
  if (c.ko && style.model) return { model: { ...style, fields: ['Korean', 'English'] }, fields: [c.ko, c.en] };
  return { model: BASIC, fields: [c.front, c.back] };
}

const toModel = (m) => ({ id: m.id, name: m.model, fields: m.fields, templates: m.templates, css: CARD_CSS });

/** Phones and tablets have no AnkiConnect: they get an .apkg file to open in the Anki app instead. */
export const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

/** Start loading the .apkg builder in the background, so a tap can share the file straight away. */
export const prepareAnkiFile = () => loadSql().catch(() => {});

/** The .apkg file for these cards. The deck and note types come with it, and words already in Anki are not duplicated. */
export async function ankiFile(filename, deck, cards) {
  const notes = cards.map((c) => {
    const n = fileNoteFor(c);
    return { ...n, model: toModel(n.model), tags: ['korean-study', ...(c.tags || [])] };
  });
  const data = await buildApkg(deck, notes);
  return new File([data], filename, { type: 'application/octet-stream' });
}

/**
 * Hand an .apkg file to Anki: the share sheet on phones (pick Anki), otherwise a download to open with Anki.
 * Returns true once shared or downloaded, false if cancelled. Throws NotAllowedError if the share sheet needs
 * a fresh tap (iOS allows it only right after one) — call again from a new click with the same file.
 */
export async function giveAnkiFile(file) {
  if (isMobile && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return true;
    } catch (e) {
      if (e.name === 'AbortError') return false;
      if (e.name === 'NotAllowedError') throw e;
      // anything else: fall back to a download
    }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file);
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 60000);
  return true;
}

/** A vocab card: Korean word + English meaning (front/back are used with a custom note type). */
export const wordCard = (w, tags = []) => ({ ko: w.ko, en: w.en || '?', front: w.ko, back: w.en || '?', tags });
