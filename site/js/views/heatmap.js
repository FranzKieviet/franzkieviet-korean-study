// GitHub-style activity grid: one column per week (Sunday on top), one cell per day, darker = more points.
import { h } from '../dom.js';
import { todayStr } from '../rng.js';

const WEEKS = 26;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const level = (n) => (n <= 0 ? 0 : n >= 4 ? 4 : n);

/** Consecutive days with points, counting back from today (or yesterday, if today has none yet). */
function streak(log) {
  const d = new Date();
  if (!log[todayStr(d)]) d.setDate(d.getDate() - 1);
  let n = 0;
  while (log[todayStr(d)]) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

/**
 * log: { 'YYYY-MM-DD': points }. unit: [singular, plural] for the tooltip ("set", "sets").
 */
export function heatmapCard(title, log, unit, hint) {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - today.getDay() - (WEEKS - 1) * 7); // Sunday, WEEKS-1 weeks ago

  const label = (n) => `${n} ${n === 1 ? unit[0] : unit[1]}`;
  const caption = h('div', { class: 'heat-caption muted small', 'aria-live': 'polite' }, hint);
  const show = (cell) => (caption.textContent = `${cell.dataset.label}: ${label(+cell.dataset.n)}`);

  const cells = [];
  const months = [];
  let total = 0;
  let days = 0;
  for (let w = 0; w < WEEKS; w++) {
    for (let d = 0; d < 7; d++) {
      const date = new Date(start);
      date.setDate(start.getDate() + w * 7 + d);
      if (d === 0 && (w === 0 || date.getDate() <= 7)) months.push([w, MONTHS[date.getMonth()]]);
      if (date > today) { cells.push(h('span', { class: 'heat-cell future' })); continue; }
      const n = log[todayStr(date)] || 0;
      total += n;
      if (n) days++;
      const nice = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      cells.push(h('span', {
        class: `heat-cell l${level(n)}${date.getTime() === today.getTime() ? ' today' : ''}`,
        'data-n': n, 'data-label': nice, title: `${nice}: ${label(n)}`,
      }));
    }
  }
  // drop a month label that would sit right on top of the next one
  const monthRow = months.filter(([w], i) => !(i === 0 && months[1] && months[1][0] - w < 3))
    .map(([w, m]) => h('span', { class: 'heat-month', style: `grid-column:${w + 1}` }, m));

  const grid = h('div', {
    class: 'heat-grid', role: 'img', style: `--weeks:${WEEKS}`,
    'aria-label': `${title}: ${label(total)} on ${days} day${days === 1 ? '' : 's'} in the last ${WEEKS} weeks`,
  }, ...cells);
  grid.addEventListener('pointerover', (e) => e.target.dataset?.label && show(e.target));
  grid.addEventListener('click', (e) => e.target.dataset?.label && show(e.target));
  grid.addEventListener('pointerleave', () => (caption.textContent = hint));

  const s = streak(log);
  return h('section', { class: 'card heat-card' },
    h('h2', {}, title),
    h('p', { class: 'muted small heat-sum' }, `${label(total)} in the last ${WEEKS} weeks`, s ? ` · 🔥 ${s}-day streak` : ''),
    h('div', { class: 'heat' },
      h('div', { class: 'heat-days muted', 'aria-hidden': 'true' }, h('span', {}, ''), h('span', {}, 'Mon'), h('span', {}, ''), h('span', {}, 'Wed'), h('span', {}, ''), h('span', {}, 'Fri'), h('span', {}, '')),
      h('div', { class: 'heat-main' },
        h('div', { class: 'heat-months muted', 'aria-hidden': 'true', style: `--weeks:${WEEKS}` }, ...monthRow),
        grid)),
    h('div', { class: 'heat-foot' },
      caption,
      h('span', { class: 'heat-legend muted small', 'aria-hidden': 'true' }, 'Less',
        ...[0, 1, 2, 3, 4].map((l) => h('span', { class: `heat-cell l${l}` })), 'More')));
}
