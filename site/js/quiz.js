// Shared typed-answer quiz. No multiple choice: you type, Enter checks, Enter again continues.
import { h, esc } from './dom.js';
import { norm } from './hangul.js';
import { speak, speakButton } from './tts.js';
import { state } from './state.js';

const stripHints = (s) => s.replace(/\s*\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();

/** Full Korean sentence for a question with its first answer filled in. */
export function fullSentence(q, ans = q.a[0]) {
  if (q.q && q.q.includes('___')) {
    const filled = q.q.replace('___', ans);
    // "A: … B: …" dialogues and "Q? — A" pairs: keep it all, minus hints
    return stripHints(filled);
  }
  return ans;
}

export function isCorrect(input, q) {
  const n = norm(input);
  if (!n) return false;
  if (q.a.some((a) => norm(a) === n)) return true;
  // also accept the whole sentence typed out
  if (q.q && q.q.includes('___')) return q.a.some((a) => norm(fullSentence(q, a)) === n);
  return false;
}

function promptHtml(q) {
  return esc(q.q).replace('___', '<span class="blank">＿＿＿</span>');
}

/**
 * root: container element
 * opts.questions: array of questions, or opts.generate: () => question (sprint)
 * opts.sprintSeconds: run a countdown, count correct answers
 * opts.results: prior results to resume ([{ ok, given }])
 * opts.onAnswer(q, ok, given, index), opts.onDone(summary), opts.onExit()
 */
export function runQuiz(root, opts) {
  const qs = opts.questions ? [...opts.questions] : [];
  const results = opts.results ? [...opts.results] : [];
  const sprint = !!opts.sprintSeconds;
  let idx = results.length;
  let answered = false;
  let qStart = 0;
  let deadline = 0;
  let timerId = null;
  let finished = false;

  const wrap = h('div', { class: 'quiz' });
  root.replaceChildren(wrap);

  const top = h('div', { class: 'quiz-top' });
  const bar = h('div', { class: 'bar' }, h('div'));
  const card = h('div', { class: 'card q-card' });
  wrap.append(top, bar, card);

  function current() {
    if (!qs[idx] && opts.generate) qs[idx] = opts.generate();
    return qs[idx];
  }

  function renderTop() {
    const q = current();
    const total = sprint ? '' : ` / ${qs.length}`;
    const correct = results.filter((r) => r.ok).length;
    top.replaceChildren(
      h('span', { class: 'progress' }, sprint ? `✓ ${correct}` : `${Math.min(idx + 1, qs.length)}${total}`),
      q?.topicTitle ? h('span', { class: 'chip' }, q.topicId ? `L${q.topicId.split('.')[0]} · ${q.topicTitle}` : q.topicTitle) : '',
      h('span', { class: 'spacer' }),
      sprint ? h('span', { class: 'timer', id: 'quiz-timer' }, '') : h('span', { class: 'muted small' }, `${correct} correct`),
      opts.onExit ? h('button', { class: 'btn ghost small', onclick: () => { stop(); opts.onExit(); } }, 'Exit') : '',
    );
    bar.firstChild.style.width = sprint ? `${Math.max(0, (deadline - Date.now()) / (opts.sprintSeconds * 10))}%` : `${(idx / qs.length) * 100}%`;
  }

  function show() {
    if (!sprint && idx >= qs.length) return done();
    const q = current();
    answered = false;
    qStart = Date.now();
    renderTop();

    const input = h('input', {
      class: 'answer', type: 'text', lang: q.inputLang || 'ko', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false',
      placeholder: q.placeholder || 'Type your answer…', 'aria-label': 'Your answer',
    });
    const checkBtn = h('button', { class: 'btn primary', type: 'submit' }, 'Check');
    const form = h('form', { class: 'answer-row' }, input, checkBtn);
    const feedback = h('div', { class: 'feedback', 'aria-live': 'polite' });
    const reveal = h('button', { type: 'button', class: 'btn ghost small' }, q.self ? 'Reveal' : 'Show answer');

    const promptEl = q.audio
      ? h('div', { class: 'prompt audio' }, h('button', { type: 'button', class: 'btn big-speak', onclick: () => speak(q.audio) }, '🔊 Play again'))
      : q.q ? h('div', { class: 'prompt ko', html: promptHtml(q) }) : '';

    card.replaceChildren(
      q.cue ? h('div', { class: 'cue' }, q.cue) : '',
      promptEl,
      q.en ? h('div', { class: 'en' }, q.en) : '',
      q.self ? '' : form,
      h('div', { class: 'row-actions' }, reveal),
      feedback,
    );

    if (q.audio) setTimeout(() => speak(q.audio), 150);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (answered) return next();
      if (!input.value.trim()) return;
      grade(input.value, isCorrect(input.value, q));
    });
    // Enter while the Korean IME is composing should not submit
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.isComposing) e.preventDefault();
    });
    reveal.addEventListener('click', () => {
      if (answered) return;
      if (q.self) return selfReveal();
      grade(input.value, false, true);
    });

    function selfReveal() {
      answered = true;
      reveal.remove();
      const sentence = fullSentence(q);
      speak(q.speak || sentence);
      feedback.replaceChildren(
        h('div', { class: 'answer-line' }, h('span', { class: 'ko big' }, q.a[0]), speakButton(q.speak || sentence)),
        q.a.length > 1 ? h('div', { class: 'muted small' }, `Also: ${q.a.slice(1).join(' · ')}`) : '',
        h('div', { class: 'self-btns' },
          h('button', { class: 'btn good', onclick: () => record(true, '(said it)', true) }, '✓ I got it'),
          h('button', { class: 'btn bad', onclick: () => record(false, '(said it)', true) }, '✗ Missed it')),
      );
    }

    function grade(given, ok, revealed = false) {
      answered = true;
      input.readOnly = true;
      checkBtn.textContent = 'Next →';
      reveal.remove();
      const sentence = fullSentence(q);
      const spoken = q.speak || sentence;
      const elapsed = ((Date.now() - qStart) / 1000).toFixed(1);

      if (sprint && ok) {
        record(true, given, true);
        return;
      }
      if (state.settings.autoSpeak && !sprint) speak(spoken);

      feedback.className = `feedback ${ok ? 'ok' : 'bad'}`;
      feedback.replaceChildren(
        h('div', { class: 'verdict' }, ok ? `✓ Correct · ${elapsed}s` : revealed ? 'Answer' : '✗ Not quite'),
        h('div', { class: 'answer-line' }, h('span', { class: 'ko big' }, q.a[0]), speakButton(spoken)),
        sentence !== q.a[0] ? h('div', { class: 'ko sentence' }, sentence) : '',
        q.a.length > 1 ? h('div', { class: 'muted small' }, `Also accepted: ${q.a.slice(1).join(' · ')}`) : '',
        !ok && given.trim() ? h('div', { class: 'muted small' }, `You wrote: ${given}`) : '',
        q.note ? h('div', { class: 'note' }, q.note) : '',
        !ok && given.trim()
          ? h('button', { type: 'button', class: 'btn ghost small', onclick: (e) => { results[results.length - 1].ok = true; opts.onAnswer?.(q, true, given, idx - 1, true); e.target.replaceWith(h('span', { class: 'muted small' }, 'Counted as correct.')); renderTopCounts(); } }, 'I was right')
          : '',
      );
      record(ok, given, false);
      setTimeout(() => checkBtn.focus(), 0);
    }

    function renderTopCounts() {
      const correct = results.filter((r) => r.ok).length;
      const el = top.querySelector('.muted.small');
      if (el) el.textContent = `${correct} correct`;
    }

    setTimeout(() => (q.self ? reveal : input).focus(), 0);
  }

  function record(ok, given, advance) {
    const q = qs[idx];
    results.push({ ok, given });
    opts.onAnswer?.(q, ok, given, idx);
    idx++;
    if (advance) {
      if (sprint && Date.now() >= deadline) return done();
      show();
    }
  }

  function next() {
    if (sprint && Date.now() >= deadline) return done();
    show();
  }

  function stop() {
    if (timerId) clearInterval(timerId);
    timerId = null;
  }

  function done() {
    if (finished) return;
    finished = true;
    stop();
    const answeredQs = qs.slice(0, results.length);
    const correct = results.filter((r) => r.ok).length;
    const missed = answeredQs.map((q, i) => ({ q, r: results[i] })).filter((x) => !x.r.ok);
    const summary = { correct, total: results.length, missed, results };

    const pct = results.length ? Math.round((correct / results.length) * 100) : 0;
    wrap.replaceChildren(
      h('div', { class: 'card summary' },
        h('div', { class: 'score' }, sprint ? `${correct}` : `${correct} / ${results.length}`),
        h('div', { class: 'muted' }, sprint ? `correct in ${opts.sprintSeconds} seconds` : `${pct}% correct`),
        opts.summaryExtra ? opts.summaryExtra(summary) : '',
        missed.length
          ? h('div', { class: 'missed' }, h('h3', {}, 'Review these'),
            ...missed.map(({ q }) => h('div', { class: 'missed-item' },
              h('div', { class: 'small muted' }, [q.cue, q.q].filter(Boolean).join(' · ')),
              h('div', {}, h('span', { class: 'ko' }, fullSentence(q)), speakButton(q.speak || fullSentence(q))))))
          : h('p', {}, sprint && !correct ? '' : 'Perfect! 완벽해요! 🎉'),
        h('div', { class: 'row-actions' },
          missed.length && opts.allowRetry !== false
            ? h('button', { class: 'btn primary', onclick: () => runQuiz(root, { ...opts, questions: missed.map((m) => m.q), generate: null, sprintSeconds: 0, results: null, onAnswer: opts.onRetryAnswer || null, onDone: null, summaryExtra: null }) }, 'Practice missed again')
            : '',
          opts.onExit ? h('button', { class: 'btn', onclick: () => opts.onExit() }, 'Done') : ''),
      ),
    );
    opts.onDone?.(summary);
  }

  if (sprint) {
    deadline = Date.now() + opts.sprintSeconds * 1000;
    timerId = setInterval(() => {
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      const t = document.getElementById('quiz-timer');
      if (t) t.textContent = `${left}s`;
      bar.firstChild.style.width = `${(left / opts.sprintSeconds) * 100}%`;
      if (left <= 0) {
        stop();
        if (!answered) done();
      }
    }, 200);
  }

  show();
  return { stop };
}
