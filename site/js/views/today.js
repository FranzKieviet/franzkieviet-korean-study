import { h, toast } from '../dom.js';
import { state, save, recordResult, overrideResult, markDailyDone, currentStreak, accuracy, wordsToReview } from '../state.js';
import { makeRng, todayStr } from '../rng.js';
import { grammarQuestions, pickTopics, verbQuestion, numberQuestion, learnedForms } from '../practice.js';
import { aiEnabled, aiGrammarQuestions } from '../ai.js';
import { ALL_VERBS } from '../data/words.js';
import { topicById, makeQuestion } from '../data/grammar.js';
import { runQuiz } from '../quiz.js';
import { weekIndex, hanjaForWeek, hanjaList, ankiButtons, isSunday, savedWordQuestion, todaysWordsCard } from './words.js';

const DAILY_NUM_CATS = ['sinoSmall', 'sinoBig', 'native', 'counters', 'money', 'time', 'dates', 'days', 'months', 'age', 'phone'];

const SAVED_PER_DAY = 3;

const learnedIds = () => Object.keys(state.learned).filter((k) => state.learned[k]);

/** Gemini writes the grammar questions; any it gets wrong or skips are filled from the built-in generators. */
async function aiGrammar(ids, count, r) {
  const slots = pickTopics(ids, count, r);
  const qs = await aiGrammarQuestions(slots);
  return qs.map((q, i) => q || makeQuestion(topicById(slots[i]), r)).filter(Boolean);
}

async function buildDaily(date) {
  const ids = learnedIds();
  const count = ids.length ? state.settings.dailyCount : 0;
  const r = makeRng(`daily-${date}-${ids.join(',')}-${Date.now()}`);
  let grammar = null;
  let source = 'built-in';
  if (count && aiEnabled()) {
    try {
      grammar = await aiGrammar(ids, count, r);
      source = 'gemini';
    } catch (e) {
      console.warn('Gemini question generation failed', e);
      toast(`Gemini couldn't write questions (${e.message}). Using built-in ones.`, 'bad');
    }
  }
  grammar ||= grammarQuestions(ids, count, r);
  const forms = learnedForms();
  const verbs = Array.from({ length: 4 }, () => verbQuestion(r, ALL_VERBS, forms));
  const nums = Array.from({ length: 4 }, () => numberQuestion(r, DAILY_NUM_CATS, 'read'));
  const saved = wordsToReview().slice(0, SAVED_PER_DAY).map(savedWordQuestion);
  // grammar first in a shuffled order, with drills sprinkled in
  const questions = r.shuffle([...grammar, ...verbs, ...nums, ...saved]);
  return { questions, results: [], done: false, learnedKey: ids.join(','), source };
}

export function renderToday(main, ctx) {
  const today = todayStr();
  const ids = learnedIds();
  let daily = state.daily[today];

  const dateLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const streak = currentStreak();

  let building = false;
  async function build(btn) {
    if (building) return false;
    building = true;
    if (btn) {
      btn.disabled = true;
      btn.textContent = aiEnabled() ? 'Gemini is writing today’s questions…' : 'Building…';
    }
    try {
      daily = state.daily[today] = await buildDaily(today);
      save();
      return true;
    } finally {
      building = false;
    }
  }

  // the user may have left the page while Gemini was writing
  const stillHere = (btn) => !btn || btn.isConnected;

  async function startDaily(e) {
    const btn = e?.currentTarget;
    if (!daily && !(await build(btn))) return;
    if (!stillHere(btn)) return;
    ctx.quiz = runQuiz(main, {
      questions: daily.questions,
      results: daily.results,
      onAnswer: (q, ok, given, i, override) => {
        if (override) {
          daily.results[i].ok = true;
          overrideResult(q.topicId);
        } else {
          daily.results[i] = { ok, given };
          recordResult(q.topicId, ok);
        }
        save();
      },
      onDone: () => {
        daily.done = true;
        save();
        markDailyDone();
      },
      allowRetry: true,
      onExit: () => renderToday(main, ctx),
    });
  }

  async function regenerate(e) {
    const btn = e?.currentTarget;
    if ((await build(btn)) && stillHere(btn)) renderToday(main, ctx);
  }

  const wi = weekIndex();
  const answered = daily ? daily.results.length : 0;
  const total = daily ? daily.questions.length : (ids.length ? state.settings.dailyCount : 0) + 8 + Math.min(SAVED_PER_DAY, wordsToReview().length);
  const correct = daily ? daily.results.filter((r) => r.ok).length : 0;
  const learnedChanged = daily && !daily.done && daily.learnedKey !== ids.join(',');

  // weakest learned topics
  const weak = ids.map((id) => ({ id, acc: accuracy(id), n: (state.stats[id]?.c || 0) + (state.stats[id]?.w || 0) }))
    .filter((x) => x.acc !== null && x.n >= 3).sort((a, b) => a.acc - b.acc).slice(0, 4);

  main.replaceChildren(
    h('header', { class: 'page-head' },
      h('h1', {}, '오늘의 공부'),
      h('p', { class: 'muted' }, dateLabel, ' · ', streak ? `🔥 ${streak}-day streak` : 'Start your streak today')),

    !ids.length ? h('div', { class: 'callout' },
      h('strong', {}, 'First, pick the grammar you have learned. '),
      'Daily questions only use the topics you tick. ',
      h('a', { href: '#grammar' }, 'Go to Grammar →')) : '',

    h('section', { class: 'card daily' },
      h('h2', {}, 'Daily review'),
      h('p', { class: 'muted' }, daily?.done
        ? `Done for today: ${correct} / ${daily.results.length} correct. 잘했어요! New questions tomorrow.`
        : `${total} questions: grammar from your ${ids.length} learned topic${ids.length === 1 ? '' : 's'}, plus verb conjugations and numbers${wordsToReview().length ? ' and your saved words' : ''}.`,
        daily?.source === 'gemini' ? ' Grammar questions written by Gemini.' : !daily && aiEnabled() ? ' Gemini will write the grammar questions.' : ''),
      daily && !daily.done && answered ? h('div', { class: 'bar' }, h('div', { style: `width:${(answered / total) * 100}%` })) : '',
      h('div', { class: 'row-actions' },
        daily?.done
          ? h('button', { class: 'btn', onclick: regenerate }, 'Do another round')
          : h('button', { class: 'btn primary big', onclick: startDaily }, answered ? `Continue (${answered}/${total})` : 'Start today’s review'),
        learnedChanged ? h('button', { class: 'btn ghost small', onclick: regenerate, title: 'You changed your learned topics' }, 'Rebuild with my new topics') : '')),

    h('div', { class: 'grid-2' },
      todaysWordsCard(() => renderToday(main, ctx)),
      h('section', { class: 'card' },
        h('h2', {}, 'This week’s hanja ', isSunday() ? h('span', { class: 'badge' }, 'New today!') : ''),
        hanjaList(hanjaForWeek(wi)),
        ankiButtons([wi], 'hanja'))),

    h('section', { class: 'card' },
      h('h2', {}, 'Quick drills'),
      h('div', { class: 'row-actions' },
        h('a', { class: 'btn', href: '#numbers' }, '🔢 Numbers, days & months'),
        h('a', { class: 'btn', href: '#verbs' }, '⚡ Fast verb conjugation'),
        h('a', { class: 'btn', href: '#grammar' }, '📚 Grammar topics'))),

    weak.length ? h('section', { class: 'card' },
      h('h2', {}, 'Needs work'),
      h('ul', { class: 'weak-list' }, ...weak.map((w) => h('li', {},
        h('span', {}, `L${w.id.split('.')[0]} · ${topicById(w.id).title}`),
        h('span', { class: 'acc' }, `${Math.round(w.acc * 100)}%`))))) : '',
  );
}
