import { h, toast } from '../dom.js';
import { state, save, exportState, importState, resetState } from '../state.js';
import { koreanVoices, speak, ttsSupported } from '../tts.js';
import { ankiVersion } from '../anki.js';
import { todayStr } from '../rng.js';
import { getApiKey, setApiKey, testApiKey } from '../ai.js';

const field = (label, input, help) => h('label', { class: 'field' }, h('span', {}, label), input, help ? h('small', { class: 'muted' }, help) : '');

function bind(input, key, parse = (v) => v) {
  input.addEventListener('change', () => {
    state.settings[key] = parse(input.type === 'checkbox' ? input.checked : input.value);
    save();
  });
  return input;
}

export function renderSettings(main) {
  const s = state.settings;

  const voiceSelect = h('select', {}, h('option', { value: '' }, 'Automatic'),
    ...koreanVoices().map((v) => h('option', { value: v.name, selected: s.voice === v.name }, `${v.name} (${v.lang})`)));
  bind(voiceSelect, 'voice');

  const rate = bind(h('input', { type: 'range', min: '0.5', max: '1.4', step: '0.05', value: s.ttsRate }), 'ttsRate', Number);
  const ankiStatus = h('span', { class: 'small muted' });

  const keyInput = h('input', { type: 'password', value: getApiKey(), placeholder: 'AIza…', autocomplete: 'off', spellcheck: 'false' });
  const keyStatus = h('span', { class: 'small muted' }, getApiKey() ? 'Key saved in this browser.' : '');
  keyInput.addEventListener('change', () => {
    setApiKey(keyInput.value);
    keyStatus.textContent = keyInput.value.trim() ? 'Key saved in this browser.' : 'Key removed.';
  });

  const fileInput = h('input', { type: 'file', accept: 'application/json,.json', hidden: true });
  fileInput.addEventListener('change', async () => {
    const f = fileInput.files[0];
    if (!f) return;
    try {
      importState(await f.text());
      toast('Progress imported.', 'good');
      setTimeout(() => location.reload(), 600);
    } catch (e) {
      toast(`Import failed: ${e.message}`, 'bad');
    }
  });

  main.replaceChildren(
    h('header', { class: 'page-head' }, h('h1', {}, 'Settings')),

    h('section', { class: 'card' },
      h('h2', {}, 'Daily review'),
      field('Grammar questions per day', bind(h('input', { type: 'number', min: '5', max: '50', value: s.dailyCount }), 'dailyCount', (v) => Math.max(5, Math.min(50, +v || 15))),
        'Plus 4 verb conjugations and 4 number questions. Applies from tomorrow, or rebuild today’s set on the Today page.'),
      field('Start date', bind(h('input', { type: 'date', value: state.startDate }), 'startDate'),
        'Day 1 of your words and hanja. Change this to move forward or back in the word list.')),

    h('section', { class: 'card' },
      h('h2', {}, 'AI questions (Gemini)'),
      h('p', { class: 'small' }, 'With a Gemini API key, Google’s Gemini writes new grammar questions for your daily review every day, focused on your learned and weakest topics. Without one, the built-in questions are used. Get a free key at ',
        h('a', { href: 'https://aistudio.google.com/apikey', target: '_blank', rel: 'noopener' }, 'Google AI Studio'), '.'),
      h('p', { class: 'small muted' }, 'The key is stored only in this browser and sent only to Google. It is not included in exported progress. The free tier is enough for daily use; on the free tier Google may use requests to improve its products.'),
      field('Gemini API key', keyInput),
      h('label', { class: 'check' }, bind(h('input', { type: 'checkbox', checked: s.aiQuestions }), 'aiQuestions'), ' Use Gemini for daily grammar questions'),
      h('div', { class: 'row-actions' },
        h('button', {
          class: 'btn',
          onclick: async () => {
            if (!getApiKey()) { keyStatus.textContent = 'Enter a key first.'; return; }
            keyStatus.textContent = 'Checking…';
            try { await testApiKey(); keyStatus.textContent = '✓ Key works'; } catch (e) { keyStatus.textContent = `✗ ${e.message}`; }
          },
        }, 'Test key'), keyStatus)),

    h('section', { class: 'card' },
      h('h2', {}, 'Text-to-speech'),
      !ttsSupported() ? h('p', { class: 'callout' }, 'This browser has no speech support.') : '',
      ttsSupported() && !koreanVoices().length ? h('p', { class: 'callout small' }, 'No Korean voice found yet. On Windows: Settings → Time & language → Language → add Korean (with speech). Chrome and Edge usually have one built in.') : '',
      field('Voice', voiceSelect),
      field('Speed', rate),
      h('label', { class: 'check' }, bind(h('input', { type: 'checkbox', checked: s.autoSpeak }), 'autoSpeak'), ' Read the answer aloud after each question'),
      h('div', { class: 'row-actions' }, h('button', { class: 'btn', onclick: () => speak('안녕하세요! 오늘도 한국어 공부 화이팅!') }, '🔊 Test voice'))),

    h('section', { class: 'card' },
      h('h2', {}, 'Anki'),
      h('p', { class: 'small' }, 'To add cards with one click: install the ', h('a', { href: 'https://ankiweb.net/shared/info/2055492159', target: '_blank', rel: 'noopener' }, 'AnkiConnect add-on'),
        ' (code 2055492159). In Anki go to Tools → Add-ons → AnkiConnect → Config, add this site to "webCorsOriginList", then restart Anki:'),
      h('pre', { class: 'code' }, `"webCorsOriginList": [\n    "http://localhost",\n    "${location.origin}"\n]`),
      h('p', { class: 'small muted' }, 'Anki desktop must be open when you click "Add to Anki". Otherwise use "Download for Anki" and import the file with File → Import.'),
      field('AnkiConnect URL', bind(h('input', { type: 'url', value: s.ankiUrl }), 'ankiUrl')),
      field('Deck for daily words', bind(h('input', { type: 'text', value: s.deckWords }), 'deckWords')),
      field('Deck for hanja', bind(h('input', { type: 'text', value: s.deckHanja }), 'deckHanja')),
      field('Note type', bind(h('input', { type: 'text', value: s.noteType }), 'noteType'), 'Must exist in Anki and have Front and Back fields, e.g. "Basic" or "Basic (and reversed card)".'),
      h('div', { class: 'row-actions' },
        h('button', {
          class: 'btn',
          onclick: async () => {
            ankiStatus.textContent = 'Checking…';
            try { ankiStatus.textContent = `✓ Connected (AnkiConnect v${await ankiVersion()})`; } catch { ankiStatus.textContent = '✗ Not reachable. Is Anki open, and is this site in webCorsOriginList?'; }
          },
        }, 'Test connection'), ankiStatus)),

    h('section', { class: 'card' },
      h('h2', {}, 'Your progress'),
      h('p', { class: 'small muted' }, 'Progress is saved in this browser. To move it to another device, export it here and import it there.'),
      h('div', { class: 'row-actions' },
        h('button', {
          class: 'btn',
          onclick: () => {
            const a = h('a', { href: URL.createObjectURL(new Blob([exportState()], { type: 'application/json' })), download: `korean-study-backup-${todayStr()}.json` });
            document.body.append(a); a.click(); a.remove();
          },
        }, 'Export progress'),
        h('button', { class: 'btn', onclick: () => fileInput.click() }, 'Import progress'), fileInput,
        h('button', { class: 'btn danger', onclick: () => confirm('Erase all progress, learned topics and settings?') && resetState() }, 'Reset everything'))),
  );
}
