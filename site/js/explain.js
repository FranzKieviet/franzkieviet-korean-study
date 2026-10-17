// Offline explanations for wrong answers: why the learner's answer is wrong, and why the expected one is right.
// Heuristic: spots particle mix-ups (이/가, 은/는 …), tense / negation / politeness mismatches and spelling slips.
// When a Gemini key is set, quiz.js asks Gemini for a fuller explanation (ai.js explainMistake) and shows that instead.
import { norm, hasBatchim, decompose, isHangul } from './hangul.js';
import { topicById } from './data/grammar.js';

// [after a consonant, after a vowel, what it is]
const PARTICLES = [
  ['이에요', '예요', 'the "to be" ending'],
  ['이지만', '지만', '"but"'],
  ['이랑', '랑', '"and / with"'],
  ['이나', '나', '"or"'],
  ['이요', '요', 'the short polite answer ending'],
  ['으로', '로', '"to / by / with"'],
  ['은', '는', 'the topic marker'],
  ['이', '가', 'the subject marker'],
  ['을', '를', 'the object marker'],
  ['과', '와', '"and / with"'],
];

const ROLE = {
  '은': 'the topic marker 은/는 (sets the topic or contrasts: "as for …")',
  '는': 'the topic marker 은/는 (sets the topic or contrasts: "as for …")',
  '이': 'the subject marker 이/가 (points to who/what does it, new information)',
  '가': 'the subject marker 이/가 (points to who/what does it, new information)',
  '을': 'the object marker 을/를 (what the action is done to)',
  '를': 'the object marker 을/를 (what the action is done to)',
  '에': 'the place/time particle 에 (at / to / on)',
  '에서': 'the place particle 에서 (where an action happens, or "from")',
  '도': 'the particle 도 ("also")',
  '의': 'the possessive particle 의 ("\'s")',
};

const FINALS = ['', ...'ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ'];
const lastSyl = (s) => [...s].reverse().find(isHangul) || '';

function particleMixup(stem, given, ans) {
  const end = lastSyl(stem);
  if (!end) return null;
  const finalIsL = decompose(end).f === 8;
  for (const [c, v, what] of PARTICLES) {
    for (const [right, wrong] of [[c, v], [v, c]]) {
      if (!ans.startsWith(right) || !given.startsWith(wrong) || ans.slice(right.length) !== given.slice(wrong.length)) continue;
      if (c === '으로' && finalIsL) {
        return `"${stem}" ends in ㄹ, and ㄹ counts like a vowel here, so it takes 로, not 으로.`;
      }
      const cons = hasBatchim(stem);
      const b = isHangul(stem.slice(-1)) ? ` (받침 ${FINALS[decompose(end).f]})` : '';
      return `"${stem}" ends in a ${cons ? `consonant${b}` : 'vowel (no 받침)'}, `
        + `so ${what} is ${right}. ${wrong} only goes after a ${cons ? 'vowel' : 'consonant'}.`;
    }
  }
  const g = Object.keys(ROLE).find((p) => given === p || given.startsWith(p) && ans.endsWith(given.slice(p.length)));
  const a = Object.keys(ROLE).find((p) => ans === p || ans.startsWith(p) && given.endsWith(ans.slice(p.length)));
  if (g && a && ROLE[g] !== ROLE[a]) return `You used ${ROLE[g]}, but this spot needs ${ROLE[a]}.`;
  return null;
}

const FEATURES = [
  {
    test: (s) => [...s].some((ch) => decompose(ch)?.f === 20 && !'있겠'.includes(ch)),
    has: 'Yours is in the past tense (the -았/었- part), but the sentence doesn\'t call for the past.',
    lacks: 'This needs the past tense (-았/었어요), and yours isn\'t past.',
  },
  {
    test: (s) => /거예요|거에요|겠/.test(s) || [...s].some((ch, k) => decompose(ch)?.f === 8 && /^(거|게요)/.test(s.slice(k + 1))),
    has: 'Yours uses a future / intention ending (-(으)ㄹ 거예요, -(으)ㄹ게요 …), which this sentence doesn\'t need.',
    lacks: 'This needs a future / intention ending (-(으)ㄹ 거예요, -(으)ㄹ게요 …).',
  },
  {
    raw: true,
    test: (s) => /(^|\s)(안|못)\s|(^|\s)(안|못)$|지\s*(않|못)/.test(s),
    has: 'Yours is negative (안 / 못 / -지 않다), but the sentence is affirmative.',
    lacks: 'This needs a negative (안 / 못 / -지 않다).',
  },
  {
    test: (s) => /세요|셔요|셨|십니다|시고|시는|으시/.test(s),
    has: 'Yours uses the honorific -(으)시-, which doesn\'t fit here.',
    lacks: 'This needs the honorific -(으)시- (e.g. -(으)세요), to show respect to the subject.',
  },
  {
    test: (s) => /니다$|니까$/.test(s),
    has: 'Yours is in the formal -(스)ㅂ니다 style, but this sentence uses the polite -아/어요 style.',
    lacks: 'This needs the formal -(스)ㅂ니다 style.',
  },
  {
    test: (s) => /요$/.test(s),
    has: 'Yours ends in -요, but this spot doesn\'t take the polite ending (it\'s not the end of the sentence, or another ending is needed).',
    lacks: 'Yours is missing the polite -요 ending (해요체).',
  },
];

const jamo = (s) => [...s].flatMap((ch) => {
  const d = decompose(ch);
  return d ? [`i${d.i}`, `m${d.m}`, ...(d.f ? [`f${d.f}`] : [])] : [ch];
});

function distance(a, b) {
  const dp = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[b.length];
}

/** If the learner typed the whole sentence, keep only the part that goes in the blank. */
function blankPart(q, given) {
  if (!q.q || !q.q.includes('___')) return given;
  const [before, after] = q.q.split('___').map((s) => norm(s.replace(/\([^)]*\)/g, '')));
  let g = norm(given);
  if (before && g.startsWith(before)) g = g.slice(before.length);
  if (after && g.endsWith(after)) g = g.slice(0, -after.length);
  return g;
}

/** { wrong: string[], right: string[] } — plain-English reasons, offline. */
export function explainLocal(q, givenRaw) {
  const topic = q.topicId ? topicById(q.topicId) : null;
  const right = [];
  if (q.note) right.push(q.note);
  if (topic) right.push(`The rule (${topic.title}): ${topic.meaning}.`.replace(/\.\.$/, '.'));
  else if (q.cue) right.push(`It's the form the cue asks for: ${q.cue}.`);

  const wrong = [];
  if (/[a-z]/i.test(givenRaw) && ![...givenRaw].some(isHangul) && !q.inputLang) {
    wrong.push('Your answer isn\'t in Hangul. Switch your keyboard to Korean and try again.');
    return { wrong, right };
  }

  const given = blankPart(q, givenRaw);
  const ans = norm(q.a[0]);
  // the word the blank is glued to (저___ → 저), so particle blanks have their noun
  const before = q.q && q.q.includes('___') ? q.q.split('___')[0].replace(/\([^)]*\)/g, '') : '';
  const tail = /\s$/.test(before) ? '' : norm(before.split(/\s+/).pop() || '');
  let p = 0;
  while (p < given.length && p < ans.length && given[p] === ans[p]) p++;
  // back up so a shared first letter of the particle (이에요 vs 이요) doesn't get eaten
  for (let k = p; k >= Math.max(tail ? 0 : 1, p - 2); k--) {
    const m = particleMixup(tail + ans.slice(0, k), given.slice(k), ans.slice(k));
    if (m) { wrong.push(m); break; }
  }

  if (!wrong.length) {
    const rawAns = q.a[0];
    for (const f of FEATURES) {
      const g = f.test(f.raw ? givenRaw : given);
      const a = f.test(f.raw ? rawAns : ans);
      if (g && !a) wrong.push(f.has);
      if (a && !g) wrong.push(f.lacks);
    }
  }

  if (!wrong.length) {
    const d = distance(jamo(given), jamo(ans));
    if (d && d <= 2) wrong.push(`Very close: it's a spelling slip. Compare ${givenRaw.trim()} with ${q.a[0]} letter by letter.`);
    else if (q.a.length > 1 || ans.length > 0) wrong.push(`"${givenRaw.trim()}" isn't the form this sentence needs${q.cue ? ` (${q.cue})` : ''}.`);
  }
  return { wrong, right };
}
