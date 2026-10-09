// AI-written grammar questions for the daily review, using Google's Gemini API (free tier works).
// The app still decides WHICH topics to practice (weak ones more often); Gemini writes fresh sentences for them.
// The API key stays in this browser only (its own localStorage key, so it is never in exported backups).
import { topicById, makeQuestion } from './data/grammar.js';
import { makeRng } from './rng.js';
import { isCorrect } from './quiz.js';
import { state } from './state.js';

const MODEL = 'gemini-3.8-flash';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const KEY_STORE = 'korean-study-gemini-key';

export function getApiKey() {
  try { return localStorage.getItem(KEY_STORE) || ''; } catch { return ''; }
}

export function setApiKey(key) {
  try {
    if (key) localStorage.setItem(KEY_STORE, key.trim());
    else localStorage.removeItem(KEY_STORE);
  } catch { /* storage blocked */ }
}

export const aiEnabled = () => !!(state.settings.aiQuestions && getApiKey());

/** One generateContent call; returns the response text. Throws with a readable message on failure. */
async function generate(system, prompt, generationConfig = {}) {
  let res;
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': getApiKey() },
      body: JSON.stringify({
        ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig,
      }),
    });
  } catch {
    throw new Error('no connection to Gemini');
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = body.error?.message || `HTTP ${res.status}`;
    if (res.status === 429) throw new Error('free daily limit reached, try again later');
    if (/API key/i.test(msg)) throw new Error('invalid API key');
    throw new Error(msg);
  }
  if (body.promptFeedback?.blockReason) throw new Error(`request blocked (${body.promptFeedback.blockReason})`);
  const cand = body.candidates?.[0];
  const text = (cand?.content?.parts || []).filter((p) => !p.thought).map((p) => p.text || '').join('');
  if (!text) throw new Error(`empty response (${cand?.finishReason || 'unknown'})`);
  if (cand.finishReason === 'MAX_TOKENS') throw new Error('response was cut off');
  return text;
}

const SYSTEM = `You write Korean grammar practice questions for an English-speaking beginner studying the textbook "Anytime Korean" (Beginning 1 & 2).

Each question is answered by TYPING Korean, and is graded by exact match (ignoring spaces and punctuation) against your list of accepted answers. So:
- "q": a natural Korean sentence with exactly one blank written as ___ . The learner types only what goes in the blank. Or "q" may be "" when the learner must write a whole short sentence from the cue.
- "a": every correct answer a teacher would accept, most natural first. For blanks: only the text that fills the blank. Include common valid variants (e.g. 반 vs 삼십 분, with/without 저는) so correct learners are not marked wrong.
- "cue": a short English instruction shown above the question, e.g. "먹다 → past tense", "이/가 or 은/는?", "Say in Korean: 'I'm going to school.'". Put the dictionary form of the verb in the cue when the learner must conjugate it.
- "en": English translation of the complete sentence.
- "note": one short sentence explaining the rule, shown after answering. May be "".

Rules:
- Each question must practice the grammar point of its topic, and the blank must test that point, not unrelated vocabulary.
- Use only beginner vocabulary (everyday nouns, common verbs/adjectives, places, food, family, time). Polite 해요체 unless the topic is about another style.
- The answer must be unambiguous from the sentence + cue + English. If two particles or endings would both be correct, list both in "a".
- Vary sentences, people, places and situations. Do not reuse any sentence from the "recently asked" list.
- Double-check spelling, spacing, batchim rules and irregular conjugations. Wrong Korean is worse than a simple sentence.`;

const SCHEMA = {
  type: 'OBJECT',
  required: ['questions'],
  properties: {
    questions: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        required: ['topicId', 'q', 'cue', 'en', 'a', 'note'],
        propertyOrdering: ['topicId', 'q', 'cue', 'en', 'a', 'note'],
        properties: {
          topicId: { type: 'STRING' },
          q: { type: 'STRING' },
          cue: { type: 'STRING' },
          en: { type: 'STRING' },
          a: { type: 'ARRAY', items: { type: 'STRING' } },
          note: { type: 'STRING' },
        },
      },
    },
  },
};

function describeTopic(t) {
  const r = makeRng(`style-${t.id}`);
  const samples = [makeQuestion(t, r), makeQuestion(t, r)].filter(Boolean)
    .map((q) => JSON.stringify({ q: q.q, cue: q.cue, en: q.en, a: q.a }));
  return [
    `### ${t.id}: ${t.title}`,
    `Meaning: ${t.meaning}`,
    ...(t.ex || []).map(([ko, en]) => `Example: ${ko} (${en})`),
    ...samples.map((s) => `Style sample: ${s}`),
  ].join('\n');
}

/** Sentences from the last two weeks, so Gemini doesn't repeat them. */
function recentlyAsked() {
  return Object.keys(state.daily).sort().slice(-14)
    .flatMap((d) => state.daily[d].questions || [])
    .filter((q) => q.topicId)
    .map((q) => q.q || q.cue)
    .slice(-150);
}

function valid(q, allowed) {
  if (!allowed.has(q.topicId)) return false;
  const a = (q.a || []).map((s) => String(s).trim()).filter(Boolean);
  if (!a.length || !q.cue) return false;
  if (q.q && (q.q.match(/___/g) || []).length !== 1) return false;
  q.a = a;
  return isCorrect(a[0], q);
}

/**
 * slots: topic ids, one per question wanted (repeats allowed).
 * Returns quiz questions in slot order. Throws on API/network errors so the caller can fall back.
 */
export async function aiGrammarQuestions(slots) {
  const ids = [...new Set(slots)];
  const counts = slots.reduce((m, id) => ({ ...m, [id]: (m[id] || 0) + 1 }), {});
  const topics = ids.map(topicById);
  const recent = recentlyAsked();

  const prompt = [
    'Grammar topics:',
    topics.map(describeTopic).join('\n\n'),
    '',
    `Write exactly ${slots.length} questions, this many per topic:`,
    ...ids.map((id) => `- ${id}: ${counts[id]}`),
    '',
    recent.length ? `Recently asked (do not repeat):\n${recent.join('\n')}` : '',
  ].join('\n');

  const text = await generate(SYSTEM, prompt, {
    responseMimeType: 'application/json',
    responseSchema: SCHEMA,
    maxOutputTokens: 32000,
  });
  let parsed;
  try { parsed = JSON.parse(text); } catch { throw new Error('response was not valid JSON'); }

  return acceptQuestions(slots, parsed.questions);
}

/** Keep valid questions, at most the requested number per topic, in slot order (null where none). */
export function acceptQuestions(slots, questions = []) {
  const allowed = new Set(slots);
  const byTopic = {};
  for (const q of questions) {
    if (!valid(q, allowed)) continue;
    (byTopic[q.topicId] ||= []).push(q);
  }
  return slots.map((id) => {
    const q = byTopic[id]?.shift();
    return q ? { ...q, note: q.note || undefined, topicId: id, topicTitle: topicById(id).title, ai: true } : null;
  });
}

/** Cheap call to check the key works. */
export async function testApiKey() {
  await generate('', 'Say OK.', { maxOutputTokens: 256 });
}
