// Text-to-speech using the browser's built-in Korean voice.
import { state } from './state.js';

let voices = [];

const hasSpeech = typeof window !== 'undefined' && 'speechSynthesis' in window;

function loadVoices() {
  if (!hasSpeech) return;
  voices = speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith('ko'));
}

if (hasSpeech) {
  loadVoices();
  speechSynthesis.addEventListener?.('voiceschanged', loadVoices);
}

export const koreanVoices = () => voices;
export const ttsSupported = () => hasSpeech;

export function speak(text, rate) {
  if (!ttsSupported() || !text) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(String(text).replace(/___/g, ''));
  u.lang = 'ko-KR';
  const chosen = voices.find((v) => v.name === state.settings.voice) || voices.find((v) => /google/i.test(v.name)) || voices[0];
  if (chosen) u.voice = chosen;
  u.rate = rate ?? state.settings.ttsRate;
  speechSynthesis.speak(u);
}

/** A small 🔊 button that speaks the given text. */
export function speakButton(text, label = '') {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'speak';
  b.title = 'Listen';
  b.setAttribute('aria-label', `Listen: ${text}`);
  b.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M3 10v4h4l5 4V6L7 10H3zm13.5 2A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z"/></svg>${label}`;
  b.addEventListener('click', (e) => {
    e.stopPropagation();
    speak(text);
  });
  return b;
}
