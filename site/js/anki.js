// Anki integration via the AnkiConnect add-on, with a downloadable import file as fallback.
import { state } from './state.js';

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

/**
 * cards: [{ front, back, tags }]
 * Returns { added, skipped } — duplicates already in the deck are skipped.
 */
export async function addCards(deck, cards) {
  await invoke('createDeck', { deck });
  const notes = cards.map((c) => ({
    deckName: deck,
    modelName: state.settings.noteType,
    fields: { Front: c.front, Back: c.back },
    tags: ['korean-study', ...(c.tags || [])],
    options: { allowDuplicate: false, duplicateScope: 'deck' },
  }));
  const can = await invoke('canAddNotes', { notes });
  const toAdd = notes.filter((_, i) => can[i]);
  if (toAdd.length) await invoke('addNotes', { notes: toAdd });
  return { added: toAdd.length, skipped: notes.length - toAdd.length };
}

/** Download a tab-separated file Anki can import (File → Import). */
export function downloadAnkiFile(filename, deck, cards) {
  const esc = (s) => String(s).replace(/\t/g, ' ').replace(/\n/g, '<br>');
  const lines = [
    '#separator:tab',
    '#html:true',
    `#deck:${deck}`,
    `#notetype:${state.settings.noteType}`,
    '#tags column:3',
    ...cards.map((c) => [esc(c.front), esc(c.back), ['korean-study', ...(c.tags || [])].join(' ')].join('\t')),
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

export const wordCard = (w, day) => ({ front: w.ko, back: w.en, tags: [`day-${day + 1}`] });

export const hanjaCard = (h, week) => ({
  front: h.h,
  back: `<b>${h.hun}</b> — ${h.en}<br><br>${h.ex.join('<br>')}`,
  tags: [`hanja-week-${week + 1}`],
});
