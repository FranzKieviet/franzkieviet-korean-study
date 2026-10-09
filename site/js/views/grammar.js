import { h } from '../dom.js';
import { state, save, recordResult, overrideResult, accuracy } from '../state.js';
import { makeRng } from '../rng.js';
import { BOOKS, LESSONS, ALL_TOPICS } from '../data/grammar.js';
import { grammarQuestions } from '../practice.js';
import { runQuiz } from '../quiz.js';
import { speakButton } from '../tts.js';

let openLessons = new Set();

function practice(main, ctx, topicIds, count, title) {
  const r = makeRng();
  const questions = grammarQuestions(topicIds, count, r);
  window.scrollTo({ top: 0 });
  ctx.quiz = runQuiz(main, {
    questions,
    title,
    onAnswer: (q, ok, given, i, override) => (override ? overrideResult(q.topicId) : recordResult(q.topicId, ok)),
    onRetryAnswer: () => {},
    onExit: () => renderGrammar(main, ctx),
  });
}

function accBadge(id) {
  const a = accuracy(id);
  if (a === null) return h('span', { class: 'acc none', title: 'Not practiced yet' }, '—');
  const s = state.stats[id];
  const cls = a >= 0.85 ? 'good' : a >= 0.6 ? 'mid' : 'low';
  return h('span', { class: `acc ${cls}`, title: `${s.c} correct, ${s.w} wrong` }, `${Math.round(a * 100)}%`);
}

export function renderGrammar(main, ctx) {
  const learned = ALL_TOPICS.filter((t) => state.learned[t.id]);
  const countEl = h('span', {}, String(learned.length));

  const updateCounts = () => {
    countEl.textContent = String(ALL_TOPICS.filter((t) => state.learned[t.id]).length);
    main.querySelectorAll('[data-lesson-count]').forEach((el) => {
      const l = LESSONS.find((x) => x.n === +el.dataset.lessonCount);
      el.textContent = `${l.topics.filter((t) => state.learned[t.id]).length}/${l.topics.length}`;
    });
  };

  function topicRow(t) {
    const cb = h('input', { type: 'checkbox', id: `t-${t.id}`, checked: !!state.learned[t.id] });
    cb.addEventListener('change', () => {
      state.learned[t.id] = cb.checked;
      if (!cb.checked) delete state.learned[t.id];
      save();
      updateCounts();
    });
    return h('div', { class: 'topic' },
      h('div', { class: 'topic-head' },
        cb,
        h('label', { for: `t-${t.id}` }, h('span', { class: 'ko topic-title' }, t.title), h('span', { class: 'muted small topic-meaning' }, t.meaning)),
        accBadge(t.id),
        h('button', { class: 'btn small', onclick: () => practice(main, ctx, [t.id], 10, t.title) }, 'Practice')),
      h('ul', { class: 'examples' }, ...t.ex.map(([ko, en]) => h('li', {},
        h('span', { class: 'ko' }, ko), ' ', speakButton(ko.replace(/—/g, ',').split('=')[0]), en ? h('span', { class: 'muted small' }, ` ${en}`) : ''))));
  }

  function lessonBlock(l) {
    const details = h('details', { class: 'lesson', open: openLessons.has(l.n) });
    details.addEventListener('toggle', () => (details.open ? openLessons.add(l.n) : openLessons.delete(l.n)));
    const setAll = (v) => {
      l.topics.forEach((t) => (v ? (state.learned[t.id] = true) : delete state.learned[t.id]));
      save();
      details.querySelectorAll('input[type=checkbox]').forEach((c) => (c.checked = v));
      updateCounts();
    };
    details.append(
      h('summary', {},
        h('span', { class: 'lesson-n' }, `Lesson ${l.n}`),
        h('span', { class: 'ko lesson-title' }, l.title),
        h('span', { class: 'muted small lesson-theme' }, l.theme),
        h('span', { class: 'count', 'data-lesson-count': l.n }, `${l.topics.filter((t) => state.learned[t.id]).length}/${l.topics.length}`)),
      h('div', { class: 'lesson-body' },
        h('div', { class: 'row-actions' },
          h('button', { class: 'btn ghost small', onclick: () => setAll(true) }, 'Mark all learned'),
          h('button', { class: 'btn ghost small', onclick: () => setAll(false) }, 'Clear'),
          h('button', { class: 'btn small primary', onclick: () => practice(main, ctx, l.topics.map((t) => t.id), 15, `Lesson ${l.n}`) }, 'Practice whole lesson')),
        ...l.topics.map(topicRow)),
    );
    return details;
  }

  main.replaceChildren(
    h('header', { class: 'page-head' },
      h('h1', {}, 'Grammar'),
      h('p', { class: 'muted' }, 'Anytime Korean Beginning 1 & 2. Tick the topics you have learned: the daily review practices only those, focusing on your weak spots.'),
      h('div', { class: 'row-actions' },
        h('span', { class: 'pill' }, countEl, ' topics learned'),
        h('button', {
          class: 'btn primary',
          onclick: () => {
            const ids = ALL_TOPICS.filter((t) => state.learned[t.id]).map((t) => t.id);
            if (!ids.length) return alert('Tick some topics first.');
            practice(main, ctx, ids, 20, 'All learned topics');
          },
        }, 'Practice all learned (20)'))),
    ...BOOKS.map((b) => h('section', { class: 'book' },
      h('h2', {}, b.title),
      ...b.lessons.map((n) => lessonBlock(LESSONS.find((l) => l.n === n))))),
  );
}
