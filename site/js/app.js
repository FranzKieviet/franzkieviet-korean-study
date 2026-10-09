import { renderToday } from './views/today.js';
import { renderGrammar } from './views/grammar.js';
import { renderNumbers } from './views/numbers.js';
import { renderVerbs } from './views/verbs.js';
import { renderWords } from './views/words.js';
import { renderSettings } from './views/settings.js';

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

function route() {
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
route();
