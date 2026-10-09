import { h } from '../dom.js';
import { state, save } from '../state.js';
import { makeRng } from '../rng.js';
import { NUM_CATEGORIES, sino, native, nativeCounter, DAYS, MONTHS_EN, month } from '../numbers.js';
import { numberQuestion, NUM_MODES } from '../practice.js';
import { runQuiz } from '../quiz.js';
import { speakButton } from '../tts.js';

export function renderNumbers(main, ctx) {
  const s = state.settings;
  s.numCats ||= ['sinoSmall', 'native', 'days', 'months'];
  s.numMode ||= 'read';
  s.numLength ||= 'sprint';

  const catChips = Object.entries(NUM_CATEGORIES).map(([k, c]) => {
    const cb = h('input', { type: 'checkbox', checked: s.numCats.includes(k) });
    cb.addEventListener('change', () => {
      s.numCats = cb.checked ? [...new Set([...s.numCats, k])] : s.numCats.filter((x) => x !== k);
      save();
    });
    return h('label', { class: 'chip-check' }, cb, h('span', {}, c.label, h('small', { class: 'muted' }, ` ${c.note}`)));
  });

  const seg = (name, options, value, onChange) => h('div', { class: 'seg', role: 'radiogroup', 'aria-label': name },
    ...Object.entries(options).map(([k, label]) => {
      const b = h('button', { type: 'button', class: k === value ? 'on' : '', role: 'radio', 'aria-checked': String(k === value) }, label);
      b.addEventListener('click', () => {
        onChange(k);
        b.parentElement.querySelectorAll('button').forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-checked', String(x === b)); });
        renderDesc();
      });
      return b;
    }));

  const desc = h('p', { class: 'muted small' });
  const bestEl = h('p', { class: 'small' });
  function renderDesc() {
    desc.textContent = NUM_MODES[s.numMode].desc;
    const best = state.best[`num-${s.numMode}`];
    bestEl.textContent = best ? `Best 60-second sprint (${NUM_MODES[s.numMode].label}): ${best} correct` : '';
  }
  renderDesc();

  function start() {
    if (!s.numCats.length) return alert('Pick at least one category.');
    const r = makeRng();
    const gen = () => numberQuestion(r, s.numCats, s.numMode);
    const sprint = s.numLength === 'sprint';
    const mode = s.numMode;
    window.scrollTo({ top: 0 });
    ctx.quiz = runQuiz(main, {
      questions: sprint ? null : Array.from({ length: 20 }, gen),
      generate: sprint ? gen : null,
      sprintSeconds: sprint ? 60 : 0,
      onDone: (sum) => {
        if (!sprint) return;
        const key = `num-${mode}`;
        if (sum.correct > (state.best[key] || 0)) { state.best[key] = sum.correct; save(); }
      },
      summaryExtra: (sum) => (sprint && sum.correct > (state.best[`num-${mode}`] || 0) ? h('p', { class: 'badge' }, 'New best! 🏆') : ''),
      onExit: () => renderNumbers(main, ctx),
    });
  }

  const nums1to10 = Array.from({ length: 10 }, (_, i) => i + 1);
  const tens = [10, 20, 30, 40, 50, 60, 70, 80, 90];
  const cell = (ko) => h('td', { class: 'ko' }, ko, ' ', speakButton(ko));

  main.replaceChildren(
    h('header', { class: 'page-head' },
      h('h1', {}, 'Numbers, days & months'),
      h('p', { class: 'muted' }, 'These have to become automatic. Do a 60-second sprint every day and try to beat your best.')),
    h('section', { class: 'card' },
      h('h2', {}, 'What to practice'),
      h('div', { class: 'chips' }, ...catChips),
      h('div', { class: 'row-actions' },
        h('button', { class: 'btn ghost small', onclick: () => { s.numCats = Object.keys(NUM_CATEGORIES); save(); renderNumbers(main, ctx); } }, 'Select all'),
        h('button', { class: 'btn ghost small', onclick: () => { s.numCats = []; save(); renderNumbers(main, ctx); } }, 'Clear')),
      h('h3', {}, 'Mode'),
      seg('Mode', Object.fromEntries(Object.entries(NUM_MODES).map(([k, m]) => [k, m.label])), s.numMode, (k) => { s.numMode = k; save(); }),
      desc,
      h('h3', {}, 'Length'),
      seg('Length', { sprint: '60-second sprint', twenty: '20 questions' }, s.numLength, (k) => { s.numLength = k; save(); }),
      bestEl,
      h('div', { class: 'row-actions' }, h('button', { class: 'btn primary big', onclick: start }, 'Start'))),

    h('details', { class: 'card cheat' },
      h('summary', {}, 'Cheat sheet'),
      h('div', { class: 'cheat-grid' },
        h('table', {},
          h('caption', {}, 'Native vs. Sino-Korean'),
          h('tr', {}, h('th', {}, '#'), h('th', {}, 'Native'), h('th', {}, 'Before counter'), h('th', {}, 'Sino')),
          ...[...nums1to10, ...tens.slice(1)].map((n) => h('tr', {}, h('td', {}, n), cell(native(n)), h('td', { class: 'ko' }, nativeCounter(n)), cell(sino(n))))),
        h('div', {},
          h('table', {},
            h('caption', {}, 'Days of the week'),
            ...DAYS.map(([ko, en]) => h('tr', {}, h('td', {}, en), cell(ko)))),
          h('table', {},
            h('caption', {}, 'Months (note 유월, 시월)'),
            ...MONTHS_EN.map((en, i) => h('tr', {}, h('td', {}, en), cell(month(i + 1))))),
          h('table', {},
            h('caption', {}, 'Big units'),
            ...[[100, '백'], [1000, '천'], [10000, '만'], [100000, '십만'], [1000000, '백만'], [10000000, '천만'], [100000000, '억']].map(([n, ko]) => h('tr', {}, h('td', {}, n.toLocaleString()), cell(ko))))),
      ),
      h('ul', { class: 'small' },
        h('li', {}, 'Use native numbers for counting things and people (명, 개, 잔, 병, 권, 마리), for hours (시) and for age (살).'),
        h('li', {}, 'Use Sino-Korean numbers for minutes (분), money (원), dates (년/월/일), floors (층) and phone numbers.'),
        h('li', {}, '10,000 is 만, not 일만. 15,000 = 만 오천. 1억 = 100,000,000.'),
        h('li', {}, '20 before a counter is 스무 (스무 살), but 21 is 스물한 (스물한 살).'))),
  );
}
