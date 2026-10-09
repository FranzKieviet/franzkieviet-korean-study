// Hangul utilities + conjugation engine.
// Syllable = 0xAC00 + (initial * 21 + medial) * 28 + final

const BASE = 0xac00;
const INITIALS = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
const MEDIALS = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ';
const FINALS = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

const M = Object.fromEntries([...MEDIALS].map((c, i) => [c, i]));
const F = Object.fromEntries(FINALS.map((c, i) => [c, i]));

export function isHangul(ch) {
  const c = ch.charCodeAt(0);
  return c >= BASE && c <= 0xd7a3;
}

export function decompose(ch) {
  if (!ch || !isHangul(ch)) return null;
  const c = ch.charCodeAt(0) - BASE;
  return { i: Math.floor(c / 588), m: Math.floor((c % 588) / 28), f: c % 28 };
}

export function compose(i, m, f = 0) {
  return String.fromCharCode(BASE + (i * 21 + m) * 28 + f);
}

const last = (s) => s[s.length - 1];
const init = (s) => s.slice(0, -1);

function lastHangul(word) {
  for (let k = word.length - 1; k >= 0; k--) if (isHangul(word[k])) return word[k];
  return null;
}

/** True if the word ends in a consonant (받침). Numbers are read Sino-Korean. */
export function hasBatchim(word) {
  const ch = last(String(word).trim());
  if (/[0-9]/.test(ch)) return '013678'.includes(ch); // 영 일 삼 육 칠 팔
  const d = decompose(lastHangul(word) || '');
  return !!d && d.f !== 0;
}

function finalOf(word) {
  const d = decompose(last(word));
  return d ? d.f : 0;
}

function setFinal(word, f) {
  const d = decompose(last(word));
  return init(word) + compose(d.i, d.m, f);
}

function setMedial(word, m) {
  const d = decompose(last(word));
  return init(word) + compose(d.i, m, d.f);
}

// ---------- Noun particles ----------
export const P = {
  ida: (n) => n + (hasBatchim(n) ? '이에요' : '예요'),
  yo: (n) => n + (hasBatchim(n) ? '이요' : '요'),
  iga: (n) => n + (hasBatchim(n) ? '이' : '가'),
  eunneun: (n) => n + (hasBatchim(n) ? '은' : '는'),
  eulreul: (n) => n + (hasBatchim(n) ? '을' : '를'),
  euro: (n) => n + (hasBatchim(n) && finalOf(n) !== F['ㄹ'] ? '으로' : '로'),
  imyeon: (n) => n + (hasBatchim(n) ? '이면' : '면'),
  inde: (n) => n + '인데',
  anieyo: (n) => n + (hasBatchim(n) ? '이 아니에요' : '가 아니에요'),
  wa: (n) => n + (hasBatchim(n) ? '과' : '와'),
  ssi: (n) => n + ' 씨',
};

// ---------- Verbs ----------
// A verb is { d: '먹다', en: 'to eat', t: 'v'|'a', irr?: 'ㅂ'|'ㄷ'|'ㅅ'|'르'|'ㅎ', bright?: bool }

export const stemOf = (v) => v.d.slice(0, -1);

const HON_SPECIAL = {
  먹다: '드시', 마시다: '드시', 자다: '주무시', 있다: '계시', 말하다: '말씀하시',
};

function isHada(stem) {
  return last(stem) === '하';
}

function isBright(syl) {
  const d = decompose(syl);
  return d && (d.m === M['ㅏ'] || d.m === M['ㅗ'] || d.m === M['ㅑ']);
}

/** The -아/어 form (infinitive): 먹어, 가, 봐, 해, 마셔, 추워, 들어, 나아, 몰라 */
export function inf(v) {
  let s = stemOf(v);
  if (isHada(s)) return init(s) + '해';
  if (v.d === '이다') return '이어';

  switch (v.irr) {
    case 'ㅂ': {
      const base = setFinal(s, 0);
      const wa = v.d === '돕다' || v.d === '곱다';
      return base + (wa ? '와' : '워');
    }
    case 'ㄷ':
      s = setFinal(s, F['ㄹ']);
      break;
    case 'ㅅ': {
      const base = setFinal(s, 0);
      return base + (isBright(last(base)) ? '아' : '어');
    }
    case '르': {
      const prev = s.slice(0, -1); // e.g. 모 in 모르
      const withL = setFinal(prev, F['ㄹ']);
      return withL + (isBright(last(prev)) ? '라' : '러');
    }
    case 'ㅎ': {
      const d = decompose(last(s));
      const m = d.m === M['ㅑ'] ? M['ㅒ'] : M['ㅐ'];
      return init(s) + compose(d.i, m, 0);
    }
  }

  const d = decompose(last(s));
  const bright = v.bright ?? isBright(last(s));
  if (d.f !== 0) return s + (bright ? '아' : '어');

  switch (d.m) {
    case M['ㅡ']: {
      const prevBright = s.length > 1 && isBright(s[s.length - 2]);
      return setMedial(s, prevBright ? M['ㅏ'] : M['ㅓ']);
    }
    case M['ㅗ']: return setMedial(s, M['ㅘ']);
    case M['ㅜ']: return setMedial(s, M['ㅝ']);
    case M['ㅣ']: return setMedial(s, M['ㅕ']);
    case M['ㅚ']: return setMedial(s, M['ㅙ']);
    case M['ㅟ']: case M['ㅢ']: return s + '어';
    default: return s; // ㅏ ㅓ ㅐ ㅔ ㅕ ...
  }
}

/** Past base ending in ㅆ: 먹었, 갔, 했 */
export function pastBase(v) {
  return setFinal(inf(v), F['ㅆ']);
}

/** Stem for endings that take an optional 으 */
function euBase(v) {
  let s = stemOf(v);
  switch (v.irr) {
    case 'ㅂ': return { s: setFinal(s, 0) + (v.d === '돕다' ? '우' : '우'), kind: 'vowel' };
    case 'ㄷ': return { s: setFinal(s, F['ㄹ']), kind: 'cons' };
    case 'ㅅ': return { s: setFinal(s, 0), kind: 'cons' };
    case 'ㅎ': return { s: setFinal(s, 0), kind: 'vowel' };
  }
  const f = finalOf(s);
  if (f === 0) return { s, kind: 'vowel' };
  if (f === F['ㄹ']) return { s, kind: 'rieul' };
  return { s, kind: 'cons' };
}

const initialJamo = (ch) => {
  const d = decompose(ch || '');
  return d ? INITIALS[d.i] : '';
};

/**
 * Attach an ending that takes 으 after consonants.
 * lead: '' | 'ㄴ' | 'ㄹ' | 'ㅂ' (a 받침 that merges into the stem), rest: remaining text.
 * eu(먹다,'','세요') → 먹으세요 ; eu(가다,'ㄹ',' 거예요') → 갈 거예요
 */
export function eu(v, lead, rest) {
  let { s, kind } = euBase(v);
  if (kind === 'rieul') {
    if (lead === 'ㄹ') return s + rest;
    const drop = lead === 'ㄴ' || lead === 'ㅂ' || ['ㄴ', 'ㅅ', 'ㅂ'].includes(initialJamo(rest[0]));
    if (!drop) return s + rest;
    s = setFinal(s, 0);
    kind = 'vowel';
  }
  if (kind === 'vowel') return lead ? setFinal(s, F[lead]) + rest : s + rest;
  return s + (lead ? compose(11, M['ㅡ'], F[lead]) : '으') + rest;
}

/** Plain stem for consonant-initial endings (-지만, -고, -네요, -겠-). ㄹ drops before ㄴ/ㅅ/ㅂ. */
export function plain(v, rest) {
  let s = stemOf(v);
  if (finalOf(s) === F['ㄹ'] && !v.irr && ['ㄴ', 'ㅅ', 'ㅂ'].includes(initialJamo(rest[0]))) {
    s = setFinal(s, 0);
  }
  return s + rest;
}

const isItda = (v) => /(있|없)다$/.test(v.d);

/** Formal -습니다 / -ㅂ니다 */
export function formal(v, q = false) {
  const end = q ? '니까' : '니다';
  const s = stemOf(v);
  const f = finalOf(s);
  if (f === 0) return setFinal(s, F['ㅂ']) + end;
  if (f === F['ㄹ'] && !v.irr) return setFinal(s, F['ㅂ']) + end;
  return s + '습' + end;
}

export function honStem(v) {
  return HON_SPECIAL[v.d] || null;
}

// ---------- Named forms used by drills ----------
export const FORMS = {
  present: { label: 'Present polite (-아/어요)', lesson: 4, make: (v) => [inf(v) + '요'] },
  negative: { label: 'Negative (안 ~아/어요)', lesson: 4, make: (v) => [neg(v, inf(v) + '요')] },
  honorific: {
    label: 'Honorific (-(으)세요)', lesson: 5,
    make: (v) => {
      const sp = honStem(v);
      return sp ? [init(sp) + '세요', eu(v, '', '세요')] : [eu(v, '', '세요')];
    },
  },
  promise: { label: 'I will (-(으)ㄹ게요)', lesson: 7, verbOnly: true, make: (v) => [eu(v, 'ㄹ', '게요')] },
  wouldYou: { label: 'Would you like to? (-(으)ㄹ래요?)', lesson: 8, verbOnly: true, make: (v) => [eu(v, 'ㄹ', '래요?')] },
  shallWe: { label: 'Shall we? (-(으)ㄹ까요?)', lesson: 10, make: (v) => [eu(v, 'ㄹ', '까요?')] },
  because: { label: 'Because (-아/어서요)', lesson: 11, make: (v) => [inf(v) + '서요'] },
  past: { label: 'Past (-았/었어요)', lesson: 12, make: (v) => [pastBase(v) + '어요'] },
  wow: { label: 'Realization (-네요)', lesson: 12, make: (v) => [plain(v, '네요')] },
  looks: { label: 'Looks ~ (-아/어 보여요)', lesson: 13, adjOnly: true, make: (v) => [inf(v) + ' 보여요'] },
  if: { label: 'If (-(으)면)', lesson: 14, make: (v) => [eu(v, '', '면')] },
  become: { label: 'Becomes (-아/어져요)', lesson: 14, adjOnly: true, make: (v) => [inf(v) + '져요'] },
  purpose: { label: 'Go to ~ (-(으)러 가요)', lesson: 15, verbOnly: true, make: (v) => [eu(v, '', '러 가요')] },
  tried: { label: 'Have tried (-아/어 봤어요)', lesson: 15, verbOnly: true, make: (v) => [inf(v) + ' 봤어요'] },
  background: {
    label: 'Background (-는데 / -(으)ㄴ데)', lesson: 15,
    make: (v) => [v.t === 'v' || isItda(v) ? plain(v, '는데') : eu(v, 'ㄴ', '데')],
  },
  but: { label: 'But (-지만)', lesson: 16, make: (v) => [stemOf(v) + '지만'] },
  try: { label: 'Please try (-아/어 보세요)', lesson: 16, verbOnly: true, make: (v) => [inf(v) + ' 보세요'] },
  banmal: { label: 'Casual (반말 -아/어)', lesson: 16, make: (v) => [inf(v)] },
  future: { label: 'Future (-(으)ㄹ 거예요)', lesson: 17, make: (v) => [eu(v, 'ㄹ', ' 거예요')] },
  right: { label: 'Right? (-지요?/-죠?)', lesson: 17, make: (v) => [stemOf(v) + '죠?', stemOf(v) + '지요?'] },
  intend: { label: 'Intend to (-(으)려고 해요)', lesson: 17, verbOnly: true, make: (v) => [eu(v, '', '려고 해요')] },
  modPresent: {
    label: 'Modifier: present (-는 / adj -(으)ㄴ)', lesson: 18,
    make: (v) => [v.t === 'v' || isItda(v) ? plain(v, '는') : eu(v, 'ㄴ', '')],
  },
  modPast: { label: 'Modifier: past verb (-(으)ㄴ)', lesson: 18, verbOnly: true, make: (v) => [eu(v, 'ㄴ', '')] },
  modFuture: { label: 'Modifier: future (-(으)ㄹ)', lesson: 18, verbOnly: true, make: (v) => [eu(v, 'ㄹ', '')] },
  formal: { label: 'Formal (-습니다/-ㅂ니다)', lesson: 19, make: (v) => [formal(v)] },
  formalQ: { label: 'Formal question (-습니까?)', lesson: 19, make: (v) => [formal(v, true)] },
  guess: { label: 'Must be (-겠어요)', lesson: 19, make: (v) => [stemOf(v) + '겠어요'] },
  forYou: { label: 'Do for someone (-아/어 주세요)', lesson: 20, verbOnly: true, make: (v) => [inf(v) + ' 주세요'] },
  decided: { label: 'Decided to (-기로 했어요)', lesson: 20, verbOnly: true, make: (v) => [stemOf(v) + '기로 했어요'] },
};

/** Short negation: 안 + verb, but 하다-compounds put 안 before 하다 (공부 안 해요). */
export function neg(v, conj) {
  if (isItda(v)) {
    // 있다 → 없어요 is the natural negative
    if (v.d === '있다') return '없어요';
  }
  const s = stemOf(v);
  const noun = s.slice(0, -1);
  // 공부하다 → 공부 안 해요, but 좋아하다 → 안 좋아해요
  if (v.t === 'v' && s.length > 1 && isHada(s) && !/[아어]$/.test(noun)) {
    return noun + ' 안 ' + conj.slice(noun.length);
  }
  return '안 ' + conj;
}

/** Normalize an answer for comparison: drop spaces & punctuation. */
export function norm(s) {
  return String(s)
    .normalize('NFC')
    .toLowerCase()
    .replace(/[\s.,!?~'"“”‘’()\-–—:;·…]/g, '');
}
