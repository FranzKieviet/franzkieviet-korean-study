import { renderToday } from './views/today.js';
import { renderGrammar } from './views/grammar.js';
import { renderNumbers } from './views/numbers.js';
import { renderVerbs } from './views/verbs.js';
import { renderWords } from './views/words.js';
import { renderSettings } from './views/settings.js';
import { todayStr } from './rng.js';

const ROUTES = {
  today: renderToday,
  grammar: renderGrammar,
  numbers: renderNumbers,
  verbs: renderVerbs,
  words: renderWords,
  settings: renderSettings,
};

const main = document.getElementById('main');
const ctx = { quiz: null };

let renderedOn = todayStr();

function route() {
  renderedOn = todayStr();
  ctx.quiz?.stop?.();
  ctx.quiz = null;
  speechSynthesis?.cancel?.();
  const name = (location.hash.slice(1) || 'today').split('?')[0];
  const render = ROUTES[name] || renderToday;
  document.querySelectorAll('nav a[data-route]').forEach((a) => a.setAttribute('aria-current', a.dataset.route === name ? 'page' : 'false'));
  render(main, ctx);
  main.focus({ preventScroll: true });
  window.scrollTo({ top: 0 });
}

window.addEventListener('hashchange', route);
// a tab left open overnight shows the new day's words and review when you come back (unless mid-quiz)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && todayStr() !== renderedOn && !ctx.quiz) route();
});
route();
