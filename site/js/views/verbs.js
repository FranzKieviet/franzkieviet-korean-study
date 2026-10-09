import { h } from '../dom.js';
import { state, save } from '../state.js';
import { makeRng } from '../rng.js';
import { FORMS } from '../hangul.js';
import { ALL_VERBS, irrNote } from '../data/words.js';
import { verbPool, verbQuestion, learnedForms } from '../practice.js';
import { runQuiz } from '../quiz.js';
import { speakButton } from '../tts.js';

export function renderVerbs(main, ctx) {
  const s = state.settings;
  s.verbForms ||= learnedForms();
  s.verbPool ||= 'all';
  s.verbLength ||= 'sprint';

  const formBoxes = Object.entries(FORMS).map(([k, f]) => {
    const cb = h('input', { type: 'checkbox', checked: s.verbForms.includes(k), 'data-form': k });
    cb.addEventListener('change', () => {
      s.verbForms = cb.checked ? [...new Set([...s.verbForms, k])] : s.verbForms.filter((x) => x !== k);
      save();
    });
    return h('label', { class: 'chip-check' }, cb, h('span', {}, h('small', { class: 'muted' }, `L${f.lesson} `), f.label));
  });

  const setForms = (keys) => {
    s.verbForms = keys;
    save();
    main.querySelectorAll('[data-form]').forEach((c) => (c.checked = keys.includes(c.dataset.form)));
  };

  const poolSelect = h('select', { 'aria-label': 'Which verbs' },
    ...[['all', 'All verbs & adjectives'], ['verbs', 'Action verbs only'], ['adjectives', 'Adjectives only'], ['irregular', 'Irregular / tricky only']]
      .map(([v, l]) => h('option', { value: v, selected: s.verbPool === v }, l)));
  poolSelect.addEventListener('change', () => { s.verbPool = poolSelect.value; save(); });

  const lengthSelect = h('select', { 'aria-label': 'Length' },
    ...[['sprint', '60-second sprint'], ['twenty', '20 questions']].map(([v, l]) => h('option', { value: v, selected: s.verbLength === v }, l)));
  lengthSelect.addEventListener('change', () => { s.verbLength = lengthSelect.value; save(); });

  function start() {
    if (!s.verbForms.length) return alert('Pick at least one form.');
    const r = makeRng();
    const pool = verbPool(s.verbPool);
    const gen = () => verbQuestion(r, pool, s.verbForms);
    const sprint = s.verbLength === 'sprint';
    window.scrollTo({ top: 0 });
    ctx.quiz = runQuiz(main, {
      questions: sprint ? null : Array.from({ length: 20 }, gen),
      generate: sprint ? gen : null,
      sprintSeconds: sprint ? 60 : 0,
      onDone: (sum) => {
        if (sprint && sum.correct > (state.best.verbs || 0)) { state.best.verbs = sum.correct; save(); }
      },
      onExit: () => renderVerbs(main, ctx),
    });
  }

  // conjugation table lookup
  const table = h('div', { class: 'conj-table' });
  const verbSelect = h('select', { 'aria-label': 'Verb to look up' },
    ...[...ALL_VERBS].sort((a, b) => a.d.localeCompare(b.d, 'ko')).map((v) => h('option', { value: v.d }, `${v.d} — ${v.en}`)));
  const showTable = () => {
    const v = ALL_VERBS.find((x) => x.d === verbSelect.value);
    const rows = Object.values(FORMS).filter((f) => !(f.verbOnly && v.t !== 'v') && !(f.adjOnly && v.t !== 'a'));
    table.replaceChildren(
      irrNote(v) ? h('p', { class: 'note' }, irrNote(v)) : '',
      h('table', {}, ...rows.map((f) => {
        const forms = f.make(v);
        return h('tr', {}, h('td', { class: 'small muted' }, `L${f.lesson} · ${f.label}`), h('td', { class: 'ko' }, forms.join(' / '), ' ', speakButton(forms[0])));
      })));
  };
  verbSelect.addEventListener('change', showTable);
  showTable();

  main.replaceChildren(
    h('header', { class: 'page-head' },
      h('h1', {}, 'Fast verb conjugation'),
      h('p', { class: 'muted' }, 'See a verb and a form, type the conjugation as fast as you can. Includes ㅂ, ㄷ, ㅅ, 르, ㅎ, ㄹ and ㅡ irregulars.')),
    h('section', { class: 'card' },
      h('h2', {}, 'Forms'),
      h('div', { class: 'row-actions' },
        h('button', { class: 'btn ghost small', onclick: () => setForms(learnedForms()) }, 'From my learned lessons'),
        h('button', { class: 'btn ghost small', onclick: () => setForms(Object.keys(FORMS)) }, 'All'),
        h('button', { class: 'btn ghost small', onclick: () => setForms([]) }, 'None')),
      h('div', { class: 'chips' }, ...formBoxes),
      h('div', { class: 'form-row' }, h('label', {}, 'Verbs ', poolSelect), h('label', {}, 'Length ', lengthSelect)),
      state.best.verbs ? h('p', { class: 'small' }, `Best 60-second sprint: ${state.best.verbs} correct`) : '',
      h('div', { class: 'row-actions' }, h('button', { class: 'btn primary big', onclick: start }, 'Start'))),
    h('details', { class: 'card' },
      h('summary', {}, 'Conjugation table (look up any verb)'),
      h('div', { class: 'form-row' }, verbSelect),
      table),
  );
}
