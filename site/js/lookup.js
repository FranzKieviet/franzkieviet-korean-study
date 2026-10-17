// Word lookup for tap-to-save: finds the dictionary word (and meaning) behind a token in a sentence,
// e.g. 중국 / 사람이에요 → 사람 / 먹었어요 → 먹다, and the Korean words behind an English word ("Chinese" → 중국).
import { WORDS } from './data/vocab.js';
import { ALL_VERBS, PEOPLE, THINGS, PLACES, COUNTRIES, FOODS, DRINKS, NAMES } from './data/words.js';
import { FORMS, norm, stemOf } from './hangul.js';

const COUNTRY_NAMES = {
  미국: 'the USA', 한국: 'Korea', 중국: 'China', 일본: 'Japan', 영국: 'the UK', 독일: 'Germany', 프랑스: 'France',
  캐나다: 'Canada', 호주: 'Australia', 베트남: 'Vietnam', 네덜란드: 'the Netherlands', 멕시코: 'Mexico', 브라질: 'Brazil',
  스페인: 'Spain', 인도: 'India',
};

// Everyday words that show up in the grammar sentences but are not in the daily word list.
const EXTRA = `사람|person; 저|I, me (humble); 나|I, me (casual); 우리|we; our; 이름|name; 성함|name (honorific); 친구|friend
엄마|mom; 아빠|dad; 어머니|mother; 아버지|father; 동생|younger sibling; 언니|older sister (said by a woman); 누나|older sister (said by a man)
오빠|older brother (said by a woman); 형|older brother (said by a man); 가족|family; 나라|country; 고향|hometown
한국어|Korean (language); 한국말|Korean (language); 영어|English (language); 중국어|Chinese (language); 일본어|Japanese (language)
영화|movie; 음악|music; 노래|song; 옷|clothes; 버스|bus; 지하철|subway; 편지|letter; 사진|photo; 방|room; 문|door; 창문|window
수업|class; 숙제|homework; 시험|exam; 날씨|weather; 머리|head; hair; 메시지|message; 텔레비전|television; 불|light; fire
손|hand; 길|road; way; 답|answer; 약속|appointment; promise; 운동화|sneakers; 밖|outside; 감기|a cold; 꽃|flower; 강아지|puppy
바람|wind; 눈|eye; snow; 국|soup; 케이크|cake; 건물|building; 과일|fruit; 태권도|taekwondo; 일|work; day (date); 시|o'clock
분|minute; 몇|how many; what (number); 뭐|what; 무엇|what; 누구|who; 어디|where; 언제|when; 왜|why; 어떻게|how; 어느|which
이것|this (thing); 그것|that (thing); 저것|that (thing over there); 이거|this; 그거|that; 저거|that (over there)
여기|here; 거기|there; 저기|over there; 네|yes; 예|yes; 아니요|no; 안|not; 못|cannot; 그리고|and; 그래서|so; 하지만|but
그런데|but; by the way; 학년|school year (grade); 대학교|university; 선생님|teacher; 학생|student; 남자|man; 여자|woman
아이|child; 생일|birthday; 시간|time; hour; 오전|a.m.; 오후|p.m.; 요일|day of the week; 월|month; 년|year; 원|won (money)
있다|to exist; to have; 없다|to not exist; to not have; 이다|to be; 아니다|to not be; 하다|to do`;

const PARTICLES = ['에서는', '에서도', '한테서', '에게서', '이에요', '이었어요', '였어요', '입니다', '이지만', '인데', '에서', '에게', '한테',
  '하고', '이랑', '까지', '부터', '이나', '으로', '예요', '이요', '처럼', '보다', '마다', '밖에', '은', '는', '이', '가', '을', '를',
  '에', '도', '의', '와', '과', '로', '랑', '만', '요', '씨', '나'];

let dict = null;
let forms = null;

function build() {
  dict = new Map();
  const add = (ko, en) => { if (ko && en && !dict.has(ko)) dict.set(ko, en); };
  WORDS.forEach((w) => add(w.ko, w.en));
  [PEOPLE, THINGS, PLACES, FOODS, DRINKS].forEach((bank) => bank.forEach(([ko, en]) => add(ko, en)));
  COUNTRIES.forEach(([ko, adj]) => add(ko, `${COUNTRY_NAMES[ko] || ko} (${adj})`));
  ALL_VERBS.forEach((v) => add(v.d, v.en));
  EXTRA.split(/[;\n]\s*(?=[가-힣]+\|)/).forEach((pair) => {
    const [ko, en] = pair.split('|');
    add(ko.trim(), en.trim());
  });
  NAMES.forEach((n) => add(n, 'a name'));

  // every conjugated form the app generates, word by word (갈 거예요 → 갈), mapped back to the verb
  forms = new Map();
  for (const v of ALL_VERBS) {
    for (const f of Object.values(FORMS)) {
      let outs = [];
      try { outs = f.make(v); } catch { /* some forms don't apply to every verb */ }
      for (const o of outs) {
        const first = norm(o.split(' ').find((p) => !['안', '못'].includes(p)) || o);
        if (first && !forms.has(first)) forms.set(first, v);
      }
    }
  }
}

const entry = (ko) => ({ ko, en: dict.get(ko) });

/** Dictionary word for a Korean token from a sentence, or { ko: token, en: '' } when unknown. */
export function lookupKo(token) {
  if (!dict) build();
  const t = norm(token).replace(/[^가-힣]/g, '');
  if (!t) return null;
  if (dict.has(t)) return entry(t);
  if (forms.has(t)) return entry(forms.get(t).d);
  for (const p of PARTICLES) {
    if (t.length > p.length && t.endsWith(p)) {
      const rest = t.slice(0, -p.length);
      if (dict.has(rest)) return entry(rest);
      if (forms.has(rest)) return entry(forms.get(rest).d);
    }
  }
  // conjugations the drills don't list (먹고, 가서 …): the longest verb stem the token starts with
  const verb = ALL_VERBS.filter((v) => stemOf(v).length >= 1 && t.startsWith(stemOf(v)))
    .sort((a, b) => stemOf(b).length - stemOf(a).length)[0];
  // or the longest dictionary word it starts with (중국사람 → 중국)
  let noun = '';
  for (let k = t.length - 1; k >= 1; k--) if (dict.has(t.slice(0, k))) { noun = t.slice(0, k); break; }
  if (verb && stemOf(verb).length >= noun.length) return entry(verb.d);
  if (noun) return entry(noun);
  return { ko: t, en: '' };
}

const STOP = new Set(['the', 'and', 'you', 'are', 'was', 'were', 'not', 'for', 'with', 'that', 'this', 'what', 'who', 'how', 'into', 'from',
  'your', 'his', 'her', 'its', 'our', 'their', 'have', 'has', 'had', 'will', 'would', 'can', 'did', 'does', 'say', 'korean', 'about', 'very']);

/** Korean words whose meaning contains this English word ("Chinese" → 중국, "eat" → 먹다). */
export function lookupEn(word) {
  if (!dict) build();
  const w = word.toLowerCase().replace(/[^a-z']/g, '').replace(/'s$/, '');
  if (w.length < 3 || STOP.has(w)) return [];
  const stems = [w, w.replace(/(ing|ed|es|s)$/, ''), w.replace(/(ies)$/, 'y'), w.replace(/(ing)$/, 'e'), w.replace(/(ed)$/, 'e')]
    .filter((s) => s.length >= 3);
  const re = new RegExp(`\\b(${[...new Set(stems)].join('|')})(s|es|e|ed|ing)?\\b`, 'i');
  const hits = [];
  for (const [ko, en] of dict) {
    if (re.test(en)) hits.push({ ko, en });
  }
  // exact-word matches first, then shorter meanings
  const exact = new RegExp(`(^|[^a-z])${w}([^a-z]|$)`, 'i');
  return hits.sort((a, b) => exact.test(b.en) - exact.test(a.en) || a.en.length - b.en.length).slice(0, 4);
}
