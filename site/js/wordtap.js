// Tap a word in a question to see its meaning and save it to "My words" for review.
// Korean words are always tappable; English words only when the dictionary knows a Korean word for them.
import { h } from './dom.js';
import { state, saveWord, removeWord } from './state.js';
import { lookupKo, lookupEn } from './lookup.js';
import { speakButton } from './tts.js';

let pop = null;

function close() {
  pop?.remove();
  pop = null;
  document.removeEventListener('pointerdown', outside, true);
  document.removeEventListener('keydown', onKey, true);
}

const outside = (e) => { if (pop && !pop.contains(e.target) && !e.target.closest?.('.tap')) close(); };
const onKey = (e) => { if (e.key === 'Escape') close(); };

function saveRow(entry) {
  const meaning = entry.en ? null : h('input', { type: 'text', class: 'tap-meaning', placeholder: 'Meaning (optional)', 'aria-label': `Meaning of ${entry.ko}` });
  const btn = h('button', { type: 'button', class: 'btn small' });
  const paint = () => {
    const saved = !!state.myWords[entry.ko];
    btn.textContent = saved ? '✓ Saved · remove' : '+ Save for review';
    btn.className = `btn small ${saved ? 'ghost' : 'primary'}`;
  };
  btn.addEventListener('click', () => {
    if (state.myWords[entry.ko]) removeWord(entry.ko);
    else saveWord(entry.ko, entry.en || meaning?.value.trim() || '');
    paint();
  });
  meaning?.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); btn.click(); } });
  paint();
  return h('div', { class: 'tap-row' },
    h('div', { class: 'tap-word' }, h('span', { class: 'ko' }, entry.ko), speakButton(entry.ko), entry.en ? h('span', { class: 'muted small' }, entry.en) : ''),
    meaning || '',
    btn);
}

function open(anchor, entries) {
  close();
  pop = h('div', { class: 'tap-pop', role: 'dialog' }, ...entries.map(saveRow));
  document.body.append(pop);
  const r = anchor.getBoundingClientRect();
  const w = pop.offsetWidth;
  pop.style.top = `${r.bottom + window.scrollY + 6}px`;
  pop.style.left = `${Math.max(8, Math.min(r.left + window.scrollX, window.scrollX + document.documentElement.clientWidth - w - 8))}px`;
  document.addEventListener('pointerdown', outside, true);
  document.addEventListener('keydown', onKey, true);
}

/** Text with each Korean word (and each English word we can translate) tappable. */
export function tappable(text, cls = '') {
  const parts = String(text).split(/([가-힣]+|[A-Za-z][A-Za-z']+)/);
  return h('span', { class: cls },
    ...parts.map((p, i) => {
      if (i % 2 === 0 || !p) return p;
      if (/^[가-힣]/.test(p)) {
        return h('span', { class: 'tap', title: 'Tap to look up / save', onclick: (e) => { const x = lookupKo(p); if (x) open(e.currentTarget, [x]); } }, p);
      }
      const hits = lookupEn(p);
      return hits.length ? h('span', { class: 'tap tap-en', title: 'Tap for the Korean word', onclick: (e) => open(e.currentTarget, hits) }, p) : p;
    }));
}

export { close as closeTap };
