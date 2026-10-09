// Anytime Korean Beginning 1 & 2 — grammar topics + question generators.
// A question: { q: Korean prompt (may contain ___), cue: instruction, en: English meaning,
//               a: [accepted answers], note?: shown after answering }

import { P, FORMS, inf, eu, plain, stemOf, hasBatchim } from '../hangul.js';
import { sino, nativeCounter, native, month, time, phone, DAYS } from '../numbers.js';
import {
  VERBS, ADJECTIVES, ALL_VERBS, PEOPLE, THINGS, PLACES, COUNTRIES, NAMES, FOODS, DRINKS, irrNote,
} from './words.js';

// ---------- helpers ----------
const after = (full, base) => full.slice(base.length);

/** Static bank: items are [q, 'ans1|ans2', en, note?] */
const S = (...items) => (r) => {
  const [q, a, en, note] = r.pick(items);
  return { q, a: a.split('|'), en, note };
};

/** Build-a-sentence: [cue, 'ans1|ans2', en] — no Korean prompt, user writes the whole thing */
const B = (...items) => (r) => {
  const [cue, a, en] = r.pick(items);
  return { q: '', cue, a: a.split('|'), en };
};

const verbLike = (d) => {
  if (d.startsWith('A:')) return { d: d.slice(2), t: 'a' };
  return ALL_VERBS.find((v) => v.d === d) || { d, t: 'v' };
};

// Verbs where "I will / let's / I intend to" makes no sense
const NONVOL = new Set(['끝나다', '낫다', '모르다', '알다', '잊다', '울다', '웃다']);
const vol = (v) => !NONVOL.has(v.d);
const hasObj = (v) => /[을를]$/.test(v.frame);

/** Conjugate a bank verb inside its frame sentence. */
const conj = (formKey, pool = 'both', opts = {}) => (r) => {
  let list = pool === 'v' ? VERBS : pool === 'a' ? ADJECTIVES : ALL_VERBS;
  if (opts.filter) list = list.filter(opts.filter);
  const v = r.pick(list);
  const form = FORMS[formKey];
  // time words like 어제/내일 only go before verb frames (adjective frames often have their own: 오늘은, 요즘)
  const prefix = opts.prefix && v.t === 'v' ? opts.prefix + ' ' : '';
  return {
    q: `${prefix}${v.frame} ___${opts.suffix || ''}`,
    cue: `${v.d} → ${opts.cue || form.label}`,
    en: `${v.en}${opts.en ? ' — ' + opts.en : ''}`,
    a: form.make(v),
    note: irrNote(v),
  };
};

const ISITDA = (v) => /(있|없)다$/.test(v.d);
const CLAUSE = {
  if: { label: '-(으)면', make: (v) => eu(v, '', '면'), noun: (n) => P.imyeon(n) },
  but: { label: '-지만', make: (v) => stemOf(v) + '지만', noun: (n) => n + (hasBatchim(n) ? '이지만' : '지만') },
  because: { label: '-아/어서', make: (v) => inf(v) + '서' },
  background: {
    label: '-는데 / -(으)ㄴ데',
    make: (v) => (v.t === 'v' || ISITDA(v) ? plain(v, '는데') : eu(v, 'ㄴ', '데')),
    noun: (n) => n + '인데',
  },
  evenThough: {
    label: '-는데도 / -(으)ㄴ데도',
    make: (v) => (v.t === 'v' || ISITDA(v) ? plain(v, '는데도') : eu(v, 'ㄴ', '데도')),
    noun: (n) => n + '인데도',
  },
  while: { label: '-다가', make: (v) => stemOf(v) + '다가' },
};

/** Two-clause sentences: items [before, 'verb' or 'N:noun' or 'A:adj', after, en] */
const clause = (formKey, ...items) => (r) => {
  const [pre, d, post, en] = r.pick(items);
  const f = CLAUSE[formKey];
  let a; let cue; let note = '';
  if (d.startsWith('N:')) {
    const n = d.slice(2);
    a = f.noun(n);
    cue = `${n} (noun) + ${f.label}`;
  } else {
    const v = verbLike(d);
    a = f.make(v);
    cue = `${v.d} + ${f.label}`;
    note = irrNote(v);
  }
  return { q: `${pre ? pre + ' ' : ''}___ ${post}`, cue, en, a: [a], note };
};

// ---------- lessons ----------
export const BOOKS = [
  { title: 'Book 1 · Lessons 1–5', lessons: [1, 2, 3, 4, 5] },
  { title: 'Book 1 · Lessons 6–10', lessons: [6, 7, 8, 9, 10] },
  { title: 'Book 2 · Lessons 11–15', lessons: [11, 12, 13, 14, 15] },
  { title: 'Book 2 · Lessons 16–20', lessons: [16, 17, 18, 19, 20] },
];

export const LESSONS = [
  {
    n: 1, title: '안녕하세요? Hi!', theme: 'Exchanging greetings',
    topics: [
      {
        title: 'NOUN이에요/예요', meaning: 'am / are / is NOUN — 이에요 after a consonant, 예요 after a vowel',
        ex: [['학생이에요.', "I'm a student."], ['저는 제니예요.', "I'm Jenny."]],
        gen: [
          (r) => { const [n, en] = r.pick([...PEOPLE, ...THINGS]); return { q: `${n}___.`, cue: '이에요 or 예요?', en: `It's a ${en}. / I'm a ${en}.`, a: [after(P.ida(n), n)] }; },
          (r) => { const n = r.pick(NAMES); return { q: `저는 ${n}___.`, cue: '이에요 or 예요?', en: `I'm ${n}.`, a: [after(P.ida(n), n)] }; },
          (r) => { const [n, en] = r.pick(PEOPLE); return { q: '', cue: `Say in Korean: "I'm a ${en}." (${n})`, en: '', a: [`저는 ${P.ida(n)}`, P.ida(n)] }; },
        ],
      },
      {
        title: 'NOUN이요/요', meaning: 'Short polite answer: just "NOUN" — 이요 after a consonant, 요 after a vowel',
        ex: [['이름이 뭐예요? — 민수요.', "What's your name? — Minsu."]],
        gen: [
          (r) => { const n = r.pick(NAMES); return { q: `이름이 뭐예요? — ${n}___.`, cue: 'Short answer', en: `What's your name? — ${n}.`, a: [after(P.yo(n), n)] }; },
          (r) => { const [n, en] = r.pick(DRINKS); return { q: `뭐 마셔요? — ${n}___.`, cue: 'Short answer', en: `What are you drinking? — ${en}.`, a: [after(P.yo(n), n)] }; },
          (r) => { const [n, en] = r.pick(PLACES); return { q: `어디 가요? — ${n}___.`, cue: 'Short answer', en: `Where are you going? — ${en}.`, a: [after(P.yo(n), n)] }; },
        ],
      },
      {
        title: '성함이 어떻게 되세요?', meaning: 'What is your name? (honorific — 성함 is the honorific of 이름)',
        ex: [['성함이 어떻게 되세요? — 김민수예요.', 'May I have your name? — Kim Minsu.']],
        gen: [
          S(['___이 어떻게 되세요?', '성함', 'May I have your name? (honorific word for 이름)'],
            ['성함이 어떻게 ___?', '되세요', 'May I have your name?'],
            ['성함이 어떻게 되세요? — 김민수___.', '예요', "It's Kim Minsu."],
            ['성함이 어떻게 되세요? — 박지민___.', '이에요', "It's Park Jimin."]),
          B(['Ask a teacher their name politely (honorific)', '성함이 어떻게 되세요', 'What is your name?']),
        ],
      },
      {
        title: '뭐예요?', meaning: 'What is it?',
        ex: [['이거 뭐예요? — 핸드폰이에요.', "What's this? — It's a cell phone."]],
        gen: [
          S(['이거 ___?', '뭐예요', 'What is this?'], ['저거 ___?', '뭐예요', 'What is that over there?'], ['이름이 ___?', '뭐예요', 'What is your name?']),
          (r) => { const [n, en] = r.pick(THINGS); return { q: `이거 뭐예요? — ___.`, cue: `Answer: it's a ${en} (${n})`, en: `What's this? — It's a ${en}.`, a: [P.ida(n), `${n}요`, P.yo(n)] }; },
        ],
      },
    ],
  },
  {
    n: 2, title: '저는 미국 사람이에요.', theme: 'Nationality',
    topics: [
      {
        title: 'A은/는 B이에요/예요', meaning: 'A is B (은/는 = topic marker: 은 after a consonant, 는 after a vowel)',
        ex: [['저는 미국 사람이에요.', "I'm American."]],
        gen: [
          (r) => { const n = r.pick(NAMES); const [c, en] = r.pick(COUNTRIES); return { q: `${n}___ ${c} 사람이에요.`, cue: '은 or 는?', en: `${n} is ${en}.`, a: [after(P.eunneun(n), n)] }; },
          (r) => { const [c, en] = r.pick(COUNTRIES); return { q: `저는 ${c} 사람___.`, cue: '이에요 or 예요?', en: `I'm ${en}.`, a: ['이에요'] }; },
          (r) => { const n = r.pick(NAMES); const [j, en] = r.pick(PEOPLE); return { q: '', cue: `Build: ${n} / ${j}`, en: `${n} is a ${en}.`, a: [`${P.eunneun(n)} ${P.ida(j)}`, `${n} 씨는 ${P.ida(j)}`] }; },
          (r) => { const [c, en] = r.pick(COUNTRIES); return { q: '', cue: `Say in Korean: "I'm ${en}."`, en: '', a: [`저는 ${c} 사람이에요`] }; },
        ],
      },
      {
        title: 'Name + 씨', meaning: 'Mr. / Ms. — polite way to address someone. Never use it for yourself.',
        ex: [['제니 씨, 안녕하세요?', 'Hi, Jenny.']],
        gen: [
          (r) => { const n = r.pick(NAMES); return { q: '___, 안녕하세요?', cue: `Greet ${n} politely`, en: `Hi, ${n}!`, a: [`${n} 씨`, `${n}씨`] }; },
          (r) => { const n = r.pick(NAMES); return { q: `저는 ${n}___. (introducing yourself)`, cue: 'Finish the sentence', en: `I'm ${n}.`, a: [after(P.ida(n), n)], note: 'No 씨 when talking about yourself.' }; },
          (r) => { const n = r.pick(NAMES); return { q: `${n} ___, 어디 가요?`, cue: 'Address them politely', en: `${n}, where are you going?`, a: ['씨'] }; },
        ],
      },
      {
        title: '~은요?/~는요?', meaning: 'What about ~? / How about ~?',
        ex: [['저는 학생이에요. 민수 씨는요?', "I'm a student. How about you, Minsu?"]],
        gen: [
          S(['저는 학생이에요. 민수 씨___?', '는요', "I'm a student. How about you, Minsu?"],
            ['오늘은 바빠요. 내일___?', '은요', "I'm busy today. What about tomorrow?"],
            ['커피는 있어요. 우유___?', '는요', 'We have coffee. What about milk?'],
            ['저는 미국 사람이에요. 선생님___?', '은요', "I'm American. What about you, teacher?"],
            ['이 가방은 비싸요. 저 가방___?', '은요', 'This bag is expensive. What about that bag?'],
            ['아침은 먹었어요. 점심___?', '은요', 'I ate breakfast. What about lunch?'],
            ['한국어는 재미있어요. 일본어___?', '는요', 'Korean is fun. What about Japanese?'],
            ['저는 괜찮아요. 제니 씨___?', '는요', "I'm fine. What about you, Jenny?"]),
          (r) => { const [n, en] = r.pick(PLACES); return { q: `학교는 가까워요. ${n}___?`, cue: '은요 or 는요?', en: `School is close. What about the ${en}?`, a: [after(P.eunneun(n), n) + '요'] }; },
        ],
      },
      {
        title: 'Question words (어느, 뭐, 누구)', meaning: '어느 which, 뭐 what, 누구 who — keep statement word order, rising intonation',
        ex: [['어느 나라 사람이에요?', 'Which country are you from?'], ['누구예요?', 'Who is it?']],
        gen: [
          S(['___ 나라 사람이에요?', '어느', 'Which country are you from?'],
            ['이 사람은 ___예요?', '누구', 'Who is this person?'],
            ['이거 ___예요?', '뭐', 'What is this?'],
            ['___ 학교 학생이에요?', '어느', 'Which school are you a student at?'],
            ['저 사람이 ___예요?', '누구', 'Who is that person?'],
            ['이름이 ___예요?', '뭐', 'What is your name?'],
            ['제니 씨는 ___ 나라 사람이에요?', '어느', 'Which country is Jenny from?']),
          B(['Ask: "Who is that person?" (저 사람)', '저 사람은 누구예요|저 사람이 누구예요|저 사람 누구예요', ''],
            ['Ask: "Which country are you from?"', '어느 나라 사람이에요|어느 나라 사람이세요', '']),
        ],
      },
    ],
  },
  {
    n: 3, title: '대학생이에요?', theme: 'Year in school',
    topics: [
      {
        title: 'A은/는 B이/가 아니에요', meaning: 'A is not B — 이 after a consonant, 가 after a vowel',
        ex: [['저는 대학생이 아니에요.', "I'm not a college student."], ['저는 요리사가 아니에요.', "I'm not a chef."]],
        gen: [
          (r) => { const [j, en] = r.pick(PEOPLE); return { q: `저는 ${j}___ 아니에요.`, cue: '이 or 가?', en: `I'm not a ${en}.`, a: [after(P.iga(j), j)] }; },
          (r) => { const n = r.pick(NAMES); const [j, en] = r.pick(PEOPLE); return { q: `${P.eunneun(n)} ${P.ida(j)}.`, cue: 'Make it negative', en: `${n} is not a ${en}.`, a: [`${P.eunneun(n)} ${P.anieyo(j)}`] }; },
          (r) => { const [t, en] = r.pick(THINGS); return { q: `이거 ${t}___ 아니에요.`, cue: '이 or 가?', en: `This isn't a ${en}.`, a: [after(P.iga(t), t)] }; },
        ],
      },
      {
        title: '몇 학년이에요?', meaning: 'What year are you in school? (몇 = how many / what number)',
        ex: [['몇 학년이에요? — 3학년이에요.', 'What year are you in? — Third year.']],
        gen: [
          S(['___ 학년이에요?', '몇', 'What year are you in?'], ['몇 ___이에요?', '학년', 'What year are you in?']),
          (r) => { const n = r.int(1, 4); return { q: '몇 학년이에요? — ___.', cue: `Answer: year ${n} (Sino-Korean)`, en: `I'm in year ${n}.`, a: [`${sino(n)}학년이에요`, `${n}학년이에요`] }; },
        ],
      },
      {
        title: '저도 ~이에요/예요', meaning: 'I am also ~ (도 = also; it replaces 은/는 and 이/가)',
        ex: [['저도 대학생이에요.', "I'm a college student too."]],
        gen: [
          (r) => { const [j, en] = r.pick(PEOPLE); return { q: `A: 저는 ${P.ida(j)}. B: 저___ ${P.ida(j)}.`, cue: 'Me too', en: `I'm a ${en} too.`, a: ['도'] }; },
          S(['커피를 좋아해요. 녹차___ 좋아해요.', '도', 'I like coffee. I like green tea too.', '도 replaces 를.'],
            ['저는 대학생이에요. 민수 씨___ 대학생이에요?', '도', 'Are you a college student too, Minsu?'],
            ['동생이 있어요. 형___ 있어요.', '도', 'I have a younger sibling. I have an older brother too.']),
          (r) => { const [j, en] = r.pick(PEOPLE); return { q: '', cue: `Say in Korean: "I'm also a ${en}."`, en: '', a: [`저도 ${P.ida(j)}`] }; },
        ],
      },
    ],
  },
  {
    n: 4, title: '뭐 해요?', theme: 'Inviting someone',
    topics: [
      {
        title: 'Verbs and adjectives', meaning: 'Both end in -다 in dictionary form; adjectives conjugate like verbs',
        ex: [['먹다', 'to eat'], ['좋다', 'to be good']],
        gen: [(r) => { const v = r.pick(ALL_VERBS); return { q: FORMS.present.make(v)[0], cue: 'Dictionary form?', en: v.en, a: [v.d], note: irrNote(v) }; }],
      },
      {
        title: 'Conjugating: stem + ending', meaning: 'Drop -다 to get the stem, then add an ending',
        ex: [['가다 → 가-', ''], ['먹다 → 먹-', '']],
        gen: [
          (r) => { const v = r.pick(ALL_VERBS); return { q: `${v.d} → stem ___`, cue: 'Drop -다', en: v.en, a: [stemOf(v)] }; },
          (r) => { const v = r.pick(ALL_VERBS); return { q: `${stemOf(v)} + 아요/어요 = ___`, cue: 'Combine', en: v.en, a: FORMS.present.make(v), note: irrNote(v) }; },
        ],
      },
      {
        title: '-아요/-어요', meaning: 'Polite present: ㅏ/ㅗ → 아요, others → 어요, 하다 → 해요',
        ex: [['가요, 봐요, 먹어요, 공부해요', '']],
        gen: [conj('present', 'both', { cue: 'present polite' })],
      },
      {
        title: '안 + verb', meaning: 'not (short negation). With noun+하다: 공부 안 해요',
        ex: [['오늘 안 가요.', "I'm not going today."]],
        gen: [conj('negative', 'both', { cue: '안 + present' })],
      },
      {
        title: 'SOV word order', meaning: 'Subject – Object – Verb; the verb comes last',
        ex: [['저는 빵을 먹어요.', 'I eat bread.']],
        gen: [(r) => {
          const v = r.pick(VERBS.filter(hasObj));
          const words = ['저는', v.frame, FORMS.present.make(v)[0]];
          return { q: r.shuffle(words).join(' / '), cue: 'Put the words in Korean order', en: `I ${v.en.replace(/^to /, '')} ...`, a: [words.join(' ')] };
        }],
      },
      {
        title: '같이 ~아요/어요', meaning: "Let's ~ together (same ending, suggestion tone)",
        ex: [['같이 영화 봐요!', "Let's watch a movie together!"]],
        gen: [conj('present', 'v', { prefix: '같이', suffix: '!', filter: (v) => vol(v) && hasObj(v), cue: "let's (present)", en: "let's do it together" })],
      },
    ],
  },
  {
    n: 5, title: '무슨 일 하세요?', theme: 'Majors and jobs',
    topics: [
      {
        title: '~으세요/~세요 (honorific)', meaning: 'Honorific present — 으세요 after a consonant, 세요 after a vowel. 먹다/마시다 → 드세요',
        ex: [['무슨 일 하세요?', 'What do you do?'], ['책을 읽으세요.', '(He/she) reads a book.']],
        gen: [conj('honorific', 'v', { cue: 'honorific present' })],
      },
      {
        title: '무슨 + NOUN', meaning: 'What ~ / what kind of ~',
        ex: [['무슨 음식 좋아해요?', 'What food do you like?']],
        gen: [
          S(['___ 음식 좋아해요?', '무슨', 'What food do you like?'], ['___ 일 하세요?', '무슨', 'What work do you do?'],
            ['___ 영화 봐요?', '무슨', 'What movie are you watching?'], ['오늘 ___ 요일이에요?', '무슨', 'What day is it today?'],
            ['___ 운동 좋아하세요?', '무슨', 'What sport do you like?'], ['___ 공부를 해요?', '무슨', 'What are you studying?']),
          B(['Ask: "What music do you like?"', '무슨 음악 좋아해요|무슨 음악을 좋아해요|무슨 음악 좋아하세요|무슨 음악을 좋아하세요', '']),
        ],
      },
      {
        title: 'Please do ~ (-(으)세요)', meaning: 'Polite command / request',
        ex: [['여기 앉으세요.', 'Please sit here.'], ['들어오세요.', 'Please come in.']],
        gen: [(r) => {
          const [pre, d, en] = r.pick([['여기', '앉다', 'Please sit here.'], ['', '들어오다', 'Please come in.'], ['잠깐만', '기다리다', 'Please wait a moment.'],
            ['이름을', '쓰다', 'Please write your name.'], ['천천히', '말하다', 'Please speak slowly.'], ['책을', '읽다', 'Please read the book.'],
            ['안녕히', '가다', 'Goodbye (to someone leaving).'], ['손을', '씻다', 'Please wash your hands.'], ['문을', '닫다', 'Please close the door.'],
            ['이 노래를', '듣다', 'Please listen to this song.'], ['맛있게', '먹다', 'Enjoy your meal.'], ['창문을', '열다', 'Please open the window.']]);
          const v = verbLike(d);
          const a = FORMS.honorific.make(v);
          return { q: `${pre ? pre + ' ' : ''}___.`, cue: `${d} → please`, en, a, note: irrNote(v) };
        }],
      },
      {
        title: '... 잘하시겠어요', meaning: 'You must be good at ... (겠 = supposition)',
        ex: [['요리사세요? 요리 잘하시겠어요!', "You're a chef? You must be good at cooking!"]],
        gen: [
          S(['요리사세요? 요리 ___!', '잘하시겠어요', "You're a chef? You must be good at cooking!"],
            ['가수세요? 노래 ___!', '잘하시겠어요', "You're a singer? You must be good at singing!"],
            ['한국어 선생님이세요? 한국어 ___!', '잘하시겠어요', 'You must be good at Korean!'],
            ['수영 선수세요? 수영 ___!', '잘하시겠어요', 'You must be good at swimming!']),
          B(['Compliment a dancer: "You must be good at dancing!" (춤)', '춤 잘하시겠어요|춤을 잘하시겠어요', ''],
            ['Compliment a soccer player: "You must be good at soccer!" (축구)', '축구 잘하시겠어요|축구를 잘하시겠어요', '']),
        ],
      },
    ],
  },
  {
    n: 6, title: '기숙사 어때요?', theme: 'Dorm, living conditions, household items',
    topics: [
      {
        title: 'Place + 에', meaning: 'in / on / at / to a place (where something exists, destination)',
        ex: [['기숙사에 살아요.', 'I live in the dorm.'], ['학교에 가요.', 'I go to school.']],
        gen: [
          (r) => { const [p, en] = r.pick(PLACES); return { q: `${p}___ 가요.`, cue: 'Particle', en: `I'm going to the ${en}.`, a: ['에'] }; },
          (r) => { const [t, en] = r.pick(THINGS); const [p, pe] = r.pick([['방', 'room'], ['가방', 'bag'], ['책상 위', 'on the desk'], ['집', 'home']]); return { q: `${P.iga(t)} ${p}___ 있어요.`, cue: 'Particle', en: `The ${en} is in/at the ${pe}.`, a: ['에'] }; },
        ],
      },
      {
        title: '있어요 & 없어요', meaning: 'There is / there isn\'t; I have / I don\'t have',
        ex: [['방에 냉장고가 있어요.', 'There is a fridge in the room.'], ['룸메이트는 없어요.', "I don't have a roommate."]],
        gen: [
          (r) => { const [t, en] = r.pick(THINGS); return { q: `방에 ${t}___ 있어요.`, cue: '이 or 가?', en: `There's a ${en} in the room.`, a: [after(P.iga(t), t)] }; },
          (r) => { const [t, en] = r.pick(THINGS); return { q: `${P.iga(t)} 있어요? — 아니요, ___.`, cue: "Say you don't have it", en: `Do you have a ${en}? — No, I don't.`, a: ['없어요', `${P.iga(t)} 없어요`, `${P.eunneun(t)} 없어요`] }; },
          (r) => { const [t, en] = r.pick(THINGS); return { q: '', cue: `Say in Korean: "I have a ${en}." (${t})`, en: '', a: [`${P.iga(t)} 있어요`, `저는 ${P.iga(t)} 있어요`, `저 ${P.iga(t)} 있어요`] }; },
        ],
      },
      {
        title: '근데', meaning: 'but; by the way (casual 그런데)',
        ex: [['방이 커요. 근데 좀 비싸요.', "The room is big. But it's a bit expensive."]],
        gen: [S(['방이 커요. ___ 좀 비싸요.', '근데|그런데', "The room is big. But it's a bit expensive."],
          ['음식이 맛있어요. ___ 좀 매워요.', '근데|그런데', "The food is tasty. But it's a bit spicy."],
          ['___ 민수 씨는 어디 가요?', '근데|그런데', 'By the way, where are you going, Minsu?'],
          ['기숙사가 좋아요. ___ 좀 멀어요.', '근데|그런데', "The dorm is nice. But it's a bit far."],
          ['한국어가 재미있어요. ___ 어려워요.', '근데|그런데', "Korean is fun. But it's hard."])],
      },
      {
        title: 'NOUN이/가 어때요?', meaning: 'How is ...?',
        ex: [['기숙사가 어때요? — 좋아요.', 'How is the dorm? — Good.']],
        gen: [
          (r) => { const [p, en] = r.pick([...PLACES, ...FOODS]); return { q: `${p}___ 어때요?`, cue: '이 or 가?', en: `How is the ${en}?`, a: [after(P.iga(p), p), after(P.eunneun(p), p)] }; },
          (r) => { const v = r.pick(ADJECTIVES.slice(0, 30)); return { q: '기숙사가 어때요? — ___.', cue: `Answer with ${v.d}`, en: `How is the dorm? — It's ${v.en.replace('to be ', '')}.`, a: FORMS.present.make(v), note: irrNote(v) }; },
        ],
      },
    ],
  },
  {
    n: 7, title: '전화번호가 어떻게 되세요?', theme: 'Phone numbers',
    topics: [
      {
        title: 'Subject marker 이/가', meaning: 'Marks the subject, new information, or focus',
        ex: [['누가 와요? — 민수가 와요.', "Who's coming? — Minsu is."]],
        gen: [
          (r) => { const n = r.pick(NAMES); return { q: `누가 와요? — ${n}___ 와요.`, cue: '이 or 가?', en: `Who's coming? — ${n} is.`, a: [after(P.iga(n), n)] }; },
          S(['누가 했어요? — 제___ 했어요.', '가', 'Who did it? — I did.'], ['뭐___ 맛있어요? — 김밥이 맛있어요.', '가', "What's tasty? — The gimbap."],
            ['어디___ 좋아요?', '가', 'Where is good?'], ['누___ 왔어요?', '가', 'Who came?']),
          (r) => { const [f, en] = r.pick(FOODS); return { q: `${f}___ 정말 맛있어요.`, cue: '이 or 가?', en: `The ${en} is really tasty.`, a: [after(P.iga(f), f)] }; },
        ],
      },
      {
        title: 'Topic/contrast marker 은/는', meaning: 'Marks the topic, known information, or contrast',
        ex: [['커피는 좋아해요. 차는 안 좋아해요.', "Coffee I like. Tea I don't."]],
        gen: [
          (r) => { const [a] = r.pick(DRINKS); let b; do { [b] = r.pick(DRINKS); } while (b === a); return { q: `${P.eunneun(a)} 좋아해요. ${b}___ 안 좋아해요.`, cue: 'Contrast: 은 or 는?', en: `I like ${a}, but not ${b}.`, a: [after(P.eunneun(b), b)] }; },
          S(['오늘___ 바빠요. 내일은 괜찮아요.', '은', "Today I'm busy. Tomorrow is fine."], ['형은 키가 커요. 저___ 작아요.', '는', "My brother is tall. Me, I'm short."],
            ['한국어___ 쉬워요. 근데 한자는 어려워요.', '는', 'Korean is easy. But hanja is hard.'], ['주말에___ 쉬어요.', '는', 'On weekends I rest.']),
        ],
      },
      {
        title: 'Reading phone numbers', meaning: 'Sino-Korean digits; 0 = 공; the hyphen is read as 에',
        ex: [['010-1234-5678', '공일공에 일이삼사에 오육칠팔']],
        gen: [(r) => { const d4 = () => String(r.int(0, 9999)).padStart(4, '0'); const p = `010-${d4()}-${d4()}`; return { q: p, cue: 'Read it in Korean', en: '', a: phone(p) }; }],
      },
      {
        title: '-을게요/ㄹ게요', meaning: 'I will ~ (promise or offer, reacting to the listener; 1st person only)',
        ex: [['제가 전화할게요.', "I'll call."], ['여기서 기다릴게요.', "I'll wait here."]],
        gen: [conj('promise', 'v', { prefix: '제가', filter: vol, cue: "I'll ~ (ㄹ게요)" })],
      },
      {
        title: '-이/가 어떻게 되세요?', meaning: 'May I have ~? (polite way to ask for information)',
        ex: [['전화번호가 어떻게 되세요?', 'May I have your phone number?']],
        gen: [
          (r) => { const [n, en] = r.pick([['전화번호', 'phone number'], ['성함', 'name (honorific)'], ['연세', 'age (honorific)'], ['주소', 'address'], ['이메일 주소', 'email address'], ['생일', 'birthday']]); return { q: `${n}___ 어떻게 되세요?`, cue: '이 or 가?', en: `May I have your ${en}?`, a: [after(P.iga(n), n)] }; },
          B(['Ask for someone\'s phone number politely', '전화번호가 어떻게 되세요', ''], ['Ask for someone\'s address politely (주소)', '주소가 어떻게 되세요', '']),
        ],
      },
      {
        title: 'Possession (의, 제, 내)', meaning: '의 is often dropped; 제 = 저의, 내 = 나의',
        ex: [['제 핸드폰이에요.', "It's my phone."], ['민수 씨 책이에요.', "It's Minsu's book."]],
        gen: [S(['___ 핸드폰이에요. (my — polite)', '제', "It's my phone."], ['___ 친구예요. (my — casual 나)', '내', "It's my friend."],
          ['이거 누구 거예요? — ___ 거예요. (mine, polite)', '제', 'Whose is this? — Mine.'], ['저의 → shorter form?', '제', ''], ['나의 → shorter form?', '내', ''],
          ['___ 이름은 제니예요. (my — polite)', '제', 'My name is Jenny.'])],
      },
    ],
  },
  {
    n: 8, title: '오늘은 제가 살게요.', theme: 'Ordering drinks',
    topics: [
      {
        title: '-을래요?/ㄹ래요?', meaning: 'Would you like to ~? (asking preference); as a statement: I want to ~',
        ex: [['뭐 마실래요? — 녹차 마실래요.', 'What would you like to drink? — Green tea.']],
        gen: [
          conj('wouldYou', 'v', { filter: vol, cue: 'would you like to? (ㄹ래요?)' }),
          (r) => { const [d, en] = r.pick(DRINKS); return { q: `뭐 마실래요? — ${d} ___.`, cue: '마시다 → I want to', en: `I'd like ${en}.`, a: ['마실래요'] }; },
        ],
      },
      {
        title: 'Native Korean numerals 1–10', meaning: '하나 둘 셋 넷 다섯 여섯 일곱 여덟 아홉 열 (before counters: 한 두 세 네)',
        ex: [['커피 두 잔 주세요.', 'Two coffees, please.']],
        gen: [
          (r) => { const n = r.int(1, 10); return { q: String(n), cue: 'Native Korean number', en: '', a: [native(n)] }; },
          (r) => { const n = r.int(1, 10); const [d, en] = r.pick(DRINKS); return { q: `${d} ___ 잔 주세요.`, cue: `${n} cups`, en: `${n} ${en}, please.`, a: [nativeCounter(n)] }; },
        ],
      },
      {
        title: '그럼, ~', meaning: 'If so ~; then ~',
        ex: [['그럼 다음에 만나요.', "Then let's meet next time."]],
        gen: [S(['A: 오늘 시간 없어요. B: ___ 내일 만나요.', '그럼', "Then let's meet tomorrow."],
          ['A: 커피 안 좋아해요. B: ___ 녹차 마실래요?', '그럼', 'Then would you like green tea?'],
          ['A: 배고파요. B: ___ 밥 먹으러 가요.', '그럼', "Then let's go eat."],
          ['___ 다음에 봐요!', '그럼', 'See you next time then!'])],
      },
      {
        title: '-하고', meaning: '~ and (between nouns); with ~',
        ex: [['커피하고 케이크 주세요.', 'Coffee and cake, please.'], ['친구하고 가요.', "I'm going with a friend."]],
        gen: [
          (r) => { const [a, ae] = r.pick(DRINKS); const [b, be] = r.pick(FOODS); return { q: `${a}___ ${b} 주세요.`, cue: 'and', en: `${ae} and ${be}, please.`, a: ['하고'] }; },
          (r) => { const n = r.pick(NAMES); return { q: `${n}___ 같이 가요.`, cue: 'with', en: `I'm going with ${n}.`, a: ['하고', '랑', '이랑'] }; },
          (r) => { const [a, ae] = r.pick(DRINKS); const [b, be] = r.pick(FOODS); return { q: '', cue: `Order ${ae} and ${be} (${a}, ${b})`, en: '', a: [`${a}하고 ${b} 주세요`] }; },
        ],
      },
    ],
  },
  {
    n: 9, title: '형제 있어요?', theme: 'Family members',
    topics: [
      {
        title: '-잖아요', meaning: 'you know, ~ (reminding someone of shared information)',
        ex: [['제 동생이 학생이잖아요.', 'My younger sibling is a student, you know.']],
        gen: [
          S(['오늘 못 가요. 시험이 ___. (있다)', '있잖아요', "I can't go today. I have an exam, you know."],
            ['우산 가져가세요. 비가 ___. (오다)', '오잖아요', "Take an umbrella. It's raining, you know."],
            ['민수 씨는 한국어를 잘해요. 한국 사람___. (이다)', '이잖아요', "Minsu is good at Korean. He's Korean, you know."],
            ['제 동생이 학생___.', '이잖아요', 'My sibling is a student, you know.'],
            ['요즘 ___. (바쁘다)', '바쁘잖아요', "I'm busy these days, you know."]),
          (r) => { const v = r.pick(ALL_VERBS); return { q: `${v.frame} ___`, cue: `${v.d} + 잖아요`, en: `${v.en}, you know`, a: [plain(v, '잖아요')] }; },
        ],
      },
      {
        title: '여기 / 거기 / 저기', meaning: 'here / there (near the listener) / over there',
        ex: [['화장실이 저기 있어요.', 'The bathroom is over there.']],
        gen: [S(['화장실이 ___ 있어요. (over there)', '저기', 'The bathroom is over there.'], ['___ 앉으세요. (here)', '여기', 'Sit here.'],
          ['A: 제 가방 어디 있어요? B: ___ 있어요. (there, near you)', '거기', "It's there (by you)."], ['___가 어디예요? (here)', '여기', 'Where is this place?'],
          ['___ 있는 사람이 누구예요? (over there)', '저기', 'Who is the person over there?'])],
      },
      {
        title: '있으세요 vs. 계세요', meaning: 'Honorific 있다: 있으세요 = (you) have; 계세요 = (a person) is / stays',
        ex: [['형제 있으세요?', 'Do you have siblings?'], ['어머니는 집에 계세요.', 'My mother is at home.']],
        gen: [S(['형제 ___? (do you have — honorific)', '있으세요', 'Do you have siblings?'], ['어머니는 집에 ___. (is at home)', '계세요', 'Mother is at home.'],
          ['선생님 지금 사무실에 ___? (is the teacher in?)', '계세요', 'Is the teacher in the office now?'], ['시간 ___? (do you have — honorific)', '있으세요', 'Do you have time?'],
          ['할아버지는 서울에 ___. (lives/stays)', '계세요', 'Grandpa is in Seoul.'], ['혹시 펜 ___?', '있으세요', 'Do you happen to have a pen?'],
          ['안녕히 ___. (bye — to someone staying)', '계세요', 'Goodbye.'])],
      },
      {
        title: '혹시 ~', meaning: 'I wonder; do you happen to ~',
        ex: [['혹시 누나 있으세요?', 'Do you happen to have an older sister?']],
        gen: [
          S(['___ 누나 있으세요?', '혹시', 'Do you happen to have an older sister?'], ['___ 민수 씨 전화번호 알아요?', '혹시', "Do you happen to know Minsu's number?"], ['___ 시간 있으세요?', '혹시', 'Do you happen to have time?']),
          B(['Ask if they happen to have an umbrella (우산)', '혹시 우산 있으세요|혹시 우산 있어요', ''], ['Ask if they happen to have siblings (형제)', '혹시 형제 있으세요|혹시 형제 있어요', '']),
        ],
      },
      {
        title: '좀 ~으세요/세요', meaning: 'Please do ~ (좀 softens the request)',
        ex: [['사진 좀 보여 주세요.', 'Please show me the photo.'], ['좀 기다리세요.', 'Please wait a bit.']],
        gen: [
          (r) => { const v = r.pick(VERBS.filter((x) => hasObj(x) && vol(x))); return { q: `${v.frame} 좀 ___.`, cue: `${v.d} → please (세요)`, en: `Please ${v.en.replace(/^to /, '')}.`, a: FORMS.honorific.make(v), note: irrNote(v) }; },
          S(['사진 좀 ___. (보여 주다)', '보여 주세요', 'Please show me the photo.'], ['좀 ___. (기다리다)', '기다리세요|기다려 주세요', 'Please wait a bit.']),
        ],
      },
      {
        title: '잠깐만요', meaning: 'Just a second, please.',
        ex: [['잠깐만요, 사진 있어요.', 'Just a second, I have a photo.']],
        gen: [S(['___, 사진 있어요.', '잠깐만요', 'Just a second, I have a photo.'], ['A: 가요! B: ___! 우산 가져갈게요.', '잠깐만요', "Wait a sec! I'll bring an umbrella."]),
          B(['Say "Just a second, please."', '잠깐만요|잠시만요', ''])],
      },
    ],
  },
  {
    n: 10, title: '몇 명쯤 와요?', theme: 'Counting people and things',
    topics: [
      {
        title: 'Native vs. Sino-Korean numerals', meaning: 'Native (하나, 둘) for counting things/people/hours/age; Sino (일, 이) for money, minutes, dates, floors, phone numbers',
        ex: [['다섯 명 / 오 층', '5 people / 5th floor']],
        gen: [(r) => {
          const n = r.int(1, 30);
          const [u, sys] = r.pick([['명', 'n'], ['개', 'n'], ['잔', 'n'], ['살', 'n'], ['시', 'n'], ['원', 's'], ['분', 's'], ['층', 's'], ['월', 's'], ['일', 's']]);
          const nn = u === '시' ? r.int(1, 12) : u === '월' ? r.int(1, 12) : n;
          const a = u === '월' ? month(nn) : sys === 'n' ? `${nativeCounter(nn)} ${u}` : `${sino(nn)} ${u}`;
          return { q: `${nn}${u}`, cue: 'Read it — native or Sino?', en: '', a: [a] };
        }],
      },
      {
        title: 'Native numerals with counters', meaning: '명 people, 개 things, 잔 cups, 병 bottles, 살 age',
        ex: [['친구 다섯 명', 'five friends'], ['사과 세 개', 'three apples']],
        gen: [(r) => {
          const [noun, c, en] = r.pick([['친구', '명', 'friends'], ['사과', '개', 'apples'], ['커피', '잔', 'coffees'], ['맥주', '병', 'bottles of beer'], ['학생', '명', 'students'], ['빵', '개', 'pieces of bread'], ['물', '병', 'bottles of water']]);
          const n = r.chance(0.7) ? r.int(1, 10) : r.int(11, 25);
          return { q: `${noun} ___ 주세요/있어요.`, cue: `${n} ${en} (${c})`, en: '', a: [`${nativeCounter(n)} ${c}`] };
        }],
      },
      {
        title: 'Sino-Korean numerals (원, 분, 층)', meaning: 'Money, phone numbers, dates, minutes, floors',
        ex: [['만 원', '10,000 won'], ['삼 층', '3rd floor']],
        gen: [
          (r) => { const n = r.pick([r.int(1, 99) * 100, r.int(1, 50) * 1000, r.int(1, 9) * 10000 + r.int(0, 9) * 1000]); return { q: `커피가 ___이에요.`, cue: `${n.toLocaleString()}원`, en: '', a: [`${sino(n)} 원`] }; },
          (r) => { const n = r.int(1, 15); return { q: '화장실은 ___에 있어요.', cue: `floor ${n} (층)`, en: '', a: [`${sino(n)} 층`] }; },
          (r) => { const n = r.int(2, 59); return { q: '___ 기다렸어요.', cue: `${n} minutes`, en: '', a: [`${sino(n)} 분`, `${sino(n)} 분 동안`] }; },
        ],
      },
      {
        title: '-을까요?/ㄹ까요?', meaning: 'Shall I / we ...? / Do you think ~?',
        ex: [['같이 갈까요?', 'Shall we go together?'], ['내일 비가 올까요?', 'Do you think it will rain tomorrow?']],
        gen: [
          conj('shallWe', 'v', { prefix: '같이', filter: vol, cue: 'shall we? (ㄹ까요?)' }),
          conj('shallWe', 'a', { prefix: '내일', cue: 'do you think ...? (ㄹ까요?)' }),
        ],
      },
      {
        title: '그렇게 ...?', meaning: 'that much ...? / that ...?',
        ex: [['그렇게 많이 와요?', 'That many people are coming?']],
        gen: [S(['A: 친구 스무 명 와요. B: ___ 많이 와요?', '그렇게', 'That many are coming?'], ['A: 이 가방 50만 원이에요. B: ___ 비싸요?', '그렇게', "It's that expensive?"],
          ['A: 매일 열 시간 공부해요. B: ___ 많이 해요?', '그렇게', 'You study that much?'], ['A: 다섯 시에 일어나요. B: ___ 일찍 일어나요?', '그렇게', 'You get up that early?'])],
      },
    ],
  },
  {
    n: 11, title: '지금 몇 시예요?', theme: 'Daily agenda, arranging a meeting',
    topics: [
      {
        title: 'Telling time', meaning: 'Hours = native + 시; minutes = Sino + 분; 반 = half past',
        ex: [['두 시 삼십 분 = 두 시 반', '2:30']],
        gen: [(r) => { const h = r.int(1, 12); const m = r.pick([0, 30, 15, 45, r.int(1, 59), 10, 20, 50]); return { q: `${h}:${String(m).padStart(2, '0')}`, cue: 'Say the time', en: '', a: time(h, m) }; }],
      },
      {
        title: '-아서요/-어서요', meaning: "It's because ... (giving a reason as an answer)",
        ex: [['왜 안 와요? — 바빠서요.', "Why aren't you coming? — Because I'm busy."], ['수업이 있어서요.', 'Because I have class.']],
        gen: [(r) => {
          const d = r.pick(['바쁘다', '아프다', '피곤하다', '배고프다', '춥다', '멀다', '비싸다', '어렵다', '덥다', '맵다']);
          const v = verbLike(d);
          const q = r.pick(['왜 안 와요?', '왜 안 가요?', '왜 안 먹어요?', '왜 집에 있어요?']);
          return { q: `${q} — ___.`, cue: `${d} → because (아/어서요)`, en: `Because it's / I'm ${v.en.replace('to be ', '')}.`, a: [inf(v) + '서요'], note: irrNote(v) };
        },
        S(['왜 안 와요? — 수업이 ___. (있다)', '있어서요', 'Because I have class.'], ['왜 늦었어요? — 길이 ___. (막히다)', '막혀서요', 'Because of traffic.'])],
      },
      {
        title: '에 vs. 에서', meaning: '에 = time, destination, where something exists; 에서 = where an action happens',
        ex: [['세 시에 카페에서 만나요.', "Let's meet at the café at three."]],
        gen: [
          S(['세 시___ 만나요.', '에', "Let's meet at three."], ['카페___ 만나요.', '에서', "Let's meet at the café."], ['도서관___ 공부해요.', '에서', 'I study at the library.'],
            ['학교___ 가요.', '에', "I'm going to school."], ['집___ 있어요.', '에', "I'm at home."], ['식당___ 밥을 먹어요.', '에서', 'I eat at a restaurant.'],
            ['토요일___ 영화 봐요.', '에', 'I watch a movie on Saturday.'], ['회사___ 일해요.', '에서', 'I work at the company.'],
            ['아침 일곱 시___ 일어나요.', '에', 'I get up at 7 a.m.'], ['서울___ 친구를 만났어요.', '에서', 'I met a friend in Seoul.'], ['공원___ 운동해요.', '에서', 'I exercise in the park.']),
          (r) => { const [p, en] = r.pick(PLACES); const action = r.chance(0.5); return action ? { q: `${p}___ 친구를 만나요.`, cue: '에 or 에서?', en: `I meet a friend at the ${en}.`, a: ['에서'] } : { q: `${p}___ 가요.`, cue: '에 or 에서?', en: `I'm going to the ${en}.`, a: ['에'] }; },
        ],
      },
    ],
  },
  {
    n: 12, title: '김밥 좀 드세요.', theme: 'Korean food and recipes',
    topics: [
      {
        title: 'Past tense -았어요/었어요', meaning: 'did / was (same ㅏㅗ rule as 아요/어요; 하다 → 했어요)',
        ex: [['어제 불고기 먹었어요.', 'I ate bulgogi yesterday.'], ['맛있었어요.', 'It was delicious.']],
        gen: [conj('past', 'both', { prefix: '어제', cue: 'past' })],
      },
      {
        title: 'Object marker 을/를', meaning: 'Marks the object — 을 after a consonant, 를 after a vowel',
        ex: [['김밥을 만들었어요.', 'I made gimbap.'], ['커피를 마셔요.', 'I drink coffee.']],
        gen: [
          (r) => { const [f, en] = r.pick(FOODS); return { q: `${f}___ 먹었어요.`, cue: '을 or 를?', en: `I ate ${en}.`, a: [after(P.eulreul(f), f)] }; },
          (r) => { const [d, en] = r.pick(DRINKS); return { q: `${d}___ 마셔요.`, cue: '을 or 를?', en: `I drink ${en}.`, a: [after(P.eulreul(d), d)] }; },
          (r) => { const [t, en] = r.pick(THINGS); return { q: `${t}___ 샀어요.`, cue: '을 or 를?', en: `I bought a ${en}.`, a: [after(P.eulreul(t), t)] }; },
        ],
      },
      {
        title: '누가 / 누구를 / 뭘', meaning: '누가 = who (subject, 누구+가); 누구를 = whom; 무엇을/뭘 = what (object)',
        ex: [['누가 만들었어요?', 'Who made it?'], ['뭘 먹었어요?', 'What did you eat?']],
        gen: [S(['___ 만들었어요? (Who made it?)', '누가', 'Who made it?'], ['___ 만났어요? (Whom did you meet?)', '누구를|누굴', 'Who did you meet?'],
          ['___ 먹었어요? (What did you eat?)', '뭘|무엇을|뭐|뭐를', 'What did you eat?'], ['___ 왔어요? (Who came?)', '누가', 'Who came?'],
          ['어제 ___ 봤어요? (What did you watch?)', '뭘|뭐|무엇을|뭐를', 'What did you watch yesterday?'], ['___ 기다려요? (Who are you waiting for?)', '누구를|누굴|누구', 'Who are you waiting for?'],
          ['___ 제일 키가 커요? (Who is tallest?)', '누가', 'Who is the tallest?'])],
      },
      {
        title: '-네요', meaning: 'Spontaneous reaction or realization (wow, oh)',
        ex: [['와, 맛있네요!', 'Wow, this is tasty!'], ['비가 오네요.', "Oh, it's raining."]],
        gen: [conj('wow', 'a', { prefix: '와,', suffix: '!', cue: 'wow! (네요)' }), S(['비가 ___. (오다)', '오네요', "Oh, it's raining."], ['한국어를 정말 잘하___!', '시네요|네요', 'You speak Korean really well!'])],
      },
    ],
  },
  {
    n: 13, title: '저는 이제 스물다섯이 돼요.', theme: 'Age, months, dates, days of the week',
    topics: [
      {
        title: 'Talking about age', meaning: 'Native numerals + 살 (스물다섯 살); honorific: 연세가 어떻게 되세요?',
        ex: [['몇 살이에요? — 스물두 살이에요.', 'How old are you? — 22.']],
        gen: [
          (r) => { const n = r.int(15, 65); return { q: '몇 살이에요? — ___.', cue: `${n} years old`, en: '', a: [`${nativeCounter(n)} 살이에요`, `${nativeCounter(n)} 살`] }; },
          S(['할머니, ___가 어떻게 되세요? (honorific: age)', '연세', "Grandma, may I ask your age?"], ['___ 살이에요? (how many)', '몇', 'How old are you?']),
        ],
      },
      {
        title: 'Expressing a date', meaning: 'Sino + 년/월/일; note 유월 (June) and 시월 (Oct); 월요일–일요일',
        ex: [['생일이 시월 삼 일이에요.', 'My birthday is October 3rd.']],
        gen: [
          (r) => { const mo = r.chance(0.4) ? r.pick([6, 10]) : r.int(1, 12); const d = r.int(1, 28); return { q: '생일이 ___이에요.', cue: `${mo}/${d} (month/day)`, en: '', a: [`${month(mo)} ${sino(d)} 일`] }; },
          (r) => { const [ko, en] = r.pick(DAYS); return { q: '오늘은 ___이에요.', cue: en, en: `Today is ${en}.`, a: [ko] }; },
          (r) => { const y = r.int(1990, 2030); return { q: '___에 태어났어요.', cue: `the year ${y}`, en: `I was born in ${y}.`, a: [`${sino(y)} 년`] }; },
        ],
      },
      {
        title: 'NOUN + 으로/로 보여요', meaning: 'to look like (a) NOUN — 으로 after a consonant (except ㄹ), 로 after a vowel or ㄹ',
        ex: [['대학생으로 보여요.', 'You look like a college student.'], ['스무 살로 보여요.', 'You look twenty.']],
        gen: [
          (r) => { const [j, en] = r.pick(PEOPLE); return { q: `${j}___ 보여요.`, cue: '으로 or 로?', en: `You look like a ${en}.`, a: [after(P.euro(j), j)] }; },
          (r) => { const n = r.int(18, 50); return { q: `${nativeCounter(n)} 살___ 보여요.`, cue: '으로 or 로?', en: `You look ${n}.`, a: ['로'] }; },
        ],
      },
      {
        title: 'Adjective + 아/어 보여요', meaning: 'to look (adjective)',
        ex: [['젊어 보여요.', 'You look young.'], ['피곤해 보여요.', 'You look tired.']],
        gen: [conj('looks', 'a', { cue: 'looks ~ (아/어 보여요)' })],
      },
    ],
  },
  {
    n: 14, title: '오늘 정말 춥네요.', theme: 'Weather and temperature',
    topics: [
      {
        title: '~(이)면 / ~(으)면', meaning: 'if ...; when ...',
        ex: [['비가 오면 집에 있어요.', 'If it rains, I stay home.'], ['주말이면 쉬어요.', 'When it is the weekend, I rest.']],
        gen: [clause('if', ['비가', '오다', '집에 있어요.', 'If it rains, I stay home.'], ['시간이', '있다', '영화 봐요.', 'If I have time, I watch a movie.'],
          ['', '배고프다', '밥 먹어요.', "If I'm hungry, I eat."], ['', '피곤하다', '쉬세요.', "If you're tired, rest."], ['날씨가', '좋다', '공원에 가요.', "If the weather's nice, I go to the park."],
          ['한국에', '가다', '불고기 먹을 거예요.', 'If I go to Korea, I will eat bulgogi.'], ['음악을', '듣다', '기분이 좋아요.', 'When I listen to music, I feel good.'],
          ['', '춥다', '코트를 입으세요.', "If it's cold, wear a coat."], ['', '모르다', '물어보세요.', "If you don't know, ask."], ['', 'N:주말', '쉬어요.', 'When it is the weekend, I rest.'],
          ['', 'N:학생', '할인돼요.', "If you're a student, you get a discount."], ['서울에', '살다', '지하철을 타요.', 'If you live in Seoul, you take the subway.'])],
      },
      {
        title: 'Weather expressions', meaning: '맑다, 흐리다, 비/눈이 오다, 바람이 불다, 덥다/춥다 (ㅂ-irregular), 영하 N도',
        ex: [['오늘은 영하 5도예요.', "It's 5 below zero today."]],
        gen: [
          S(['오늘 날씨가 ___. (맑다)', '맑아요', "It's clear today."], ['비가 ___. (is raining)', '와요|오네요', "It's raining."], ['바람이 ___. (불다)', '불어요', "It's windy."],
            ['날씨가 ___. (덥다)', '더워요', "It's hot."], ['겨울은 너무 ___. (춥다)', '추워요', 'Winter is too cold.'], ['오늘은 좀 ___. (흐리다)', '흐려요', "It's a bit cloudy today."],
            ['어제 눈이 ___. (오다, past)', '왔어요', 'It snowed yesterday.'], ['오늘 날씨가 ___? (어떻다)', '어때요', "How's the weather today?"]),
          (r) => { const n = r.int(1, 35); const below = r.chance(0.4); return { q: `${below ? '-' : ''}${n}°C`, cue: 'Read the temperature', en: '', a: [`${below ? '영하 ' : ''}${sino(n)} 도`] }; },
        ],
      },
      {
        title: '-아지다/-어지다', meaning: 'to become ~ (change of state, with adjectives)',
        ex: [['날씨가 따뜻해졌어요.', 'The weather got warm.'], ['추워져요.', "It's getting cold."]],
        gen: [(r) => {
          const v = r.pick(ADJECTIVES.filter((x) => !['그렇다'].includes(x.d)));
          const past = r.chance(0.5);
          return { q: `${v.frame} ___`, cue: `${v.d} → ${past ? 'became (past)' : 'is becoming'}`, en: v.en.replace('to be', 'to become'), a: [inf(v) + (past ? '졌어요' : '져요')], note: irrNote(v) };
        }],
      },
      {
        title: '-아 죽다/-어 죽다', meaning: '~ to death (exaggeration): -아/어 죽겠어요',
        ex: [['추워 죽겠어요.', "I'm freezing to death."], ['배고파 죽겠어요.', "I'm starving."]],
        gen: [(r) => {
          const d = r.pick(['춥다', '덥다', '배고프다', '피곤하다', '바쁘다', '아프다', '졸리다', '심심하다', '힘들다', '목마르다']);
          const v = d === '목마르다' ? { d, t: 'a', irr: '르' } : verbLike(d);
          return { q: '___', cue: `${d} → ~ to death (exaggerate)`, en: '', a: [inf(v) + ' 죽겠어요'], note: irrNote(v) };
        }],
      },
    ],
  },
  {
    n: 15, title: '우리 점심 먹으러 가요.', theme: 'What to eat for lunch',
    topics: [
      {
        title: 'Responding to a negative question', meaning: '네 agrees with the statement as asked, 아니요 disagrees (the opposite of English)',
        ex: [['안 배고파요? — 네, 안 배고파요.', "Aren't you hungry? — No, I'm not."]],
        gen: [
          S(['안 배고파요? — ___, 안 배고파요.', '네|예', "No, I'm not hungry."], ['안 배고파요? — ___, 배고파요.', '아니요|아뇨', "Yes, I'm hungry."],
            ['안 바빠요? — ___, 바빠요.', '아니요|아뇨', "Yes, I'm busy."], ['커피 안 마셔요? — ___, 안 마셔요.', '네|예', "No, I don't drink it."],
            ['숙제 안 했어요? — ___, 했어요.', '아니요|아뇨', 'Yes, I did it.'], ['안 추워요? — ___, 안 추워요.', '네|예', "No, I'm not cold."],
            ['내일 학교 안 가요? — ___, 가요.', '아니요|아뇨', "Yes, I'm going."], ['민수 씨 안 왔어요? — ___, 안 왔어요.', '네|예', "No, he didn't come."]),
          (r) => {
            const v = r.pick(ADJECTIVES.filter((x) => ['피곤하다', '배고프다', '바쁘다', '춥다', '덥다', '아프다'].includes(x.d)));
            const yes = r.chance(0.5); const pres = FORMS.present.make(v)[0];
            return { q: `안 ${pres}? — ___`, cue: yes ? `Answer: you ARE ${v.en.replace('to be ', '')}` : `Answer: you are NOT ${v.en.replace('to be ', '')}`, en: '', a: yes ? [`아니요, ${pres}`, `아뇨, ${pres}`] : [`네, 안 ${pres}`, `예, 안 ${pres}`] };
          },
        ],
      },
      {
        title: '~으러 가다 / ~러 가다', meaning: 'to go (come) for the purpose of ~',
        ex: [['밥 먹으러 가요.', "I'm going to eat."], ['책 사러 왔어요.', 'I came to buy a book.']],
        gen: [conj('purpose', 'v', { filter: (v) => vol(v) && hasObj(v), cue: 'go to do (러 가요)' })],
      },
      {
        title: '-아 봤다/-어 봤다', meaning: 'to have done / tried ~ (experience)',
        ex: [['떡볶이 먹어 봤어요?', 'Have you tried tteokbokki?']],
        gen: [conj('tried', 'v', { filter: (v) => vol(v) && hasObj(v), cue: 'have tried (아/어 봤어요)' }),
          (r) => { const [f, en] = r.pick(FOODS); return { q: `${f} ___?`, cue: '먹다 → have you tried?', en: `Have you tried ${en}?`, a: ['먹어 봤어요', '먹어 보셨어요'] }; }],
      },
      {
        title: '~는데 / ~(으)ㄴ데 / ~인데', meaning: '... and / so / but (background or contrast) — 는데 verbs, (으)ㄴ데 adjectives, 인데 nouns',
        ex: [['배고픈데 밥 먹으러 가요.', "I'm hungry, so let's go eat."], ['비가 오는데 우산이 없어요.', "It's raining but I don't have an umbrella."]],
        gen: [clause('background', ['', '배고프다', '밥 먹으러 가요.', "I'm hungry, so let's go eat."], ['비가', '오다', '우산이 없어요.', "It's raining but I don't have an umbrella."],
          ['날씨가', '춥다', '코트를 입으세요.', "It's cold, so wear a coat."], ['이 식당은', '맛있다', '좀 비싸요.', 'This restaurant is tasty, but a bit expensive.'],
          ['지금', '바쁘다', '나중에 전화할게요.', "I'm busy now, so I'll call later."], ['저는 커피를', '좋아하다', '녹차는 안 좋아해요.', "I like coffee, but not green tea."],
          ['한국어를', '공부하다', '정말 재미있어요.', "I'm studying Korean and it's really fun."], ['오늘 시간이', '있다', '같이 영화 볼래요?', 'I have time today — want to see a movie?'],
          ['저는', 'N:학생', '돈이 없어요.', "I'm a student, so I don't have money."], ['방이', '크다', '좀 멀어요.', 'The room is big, but a bit far.'],
          ['내일', 'N:생일', '뭐 할 거예요?', "Tomorrow's your birthday — what will you do?"])],
      },
    ],
  },
  {
    n: 16, title: '생일 축하해요!', theme: 'Celebrating a birthday, giving a gift',
    topics: [
      {
        title: '-한테 / -한테서', meaning: 'to [person] / from [person] (spoken; written 에게 / 에게서)',
        ex: [['친구한테 선물을 줬어요.', 'I gave a friend a present.'], ['엄마한테서 받았어요.', 'I got it from Mom.']],
        gen: [S(['친구___ 선물을 줬어요.', '한테|에게', 'I gave a present to a friend.'], ['엄마___ 전화를 받았어요. (from)', '한테서|에게서|한테|에게', 'I got a call from Mom.'],
          ['동생___ 편지를 보냈어요.', '한테|에게', 'I sent a letter to my sibling.'], ['선생님___ 이메일을 받았어요. (from)', '한테서|에게서|한테|에게', 'I got an email from the teacher.'],
          ['민수 씨___ 들었어요. (from)', '한테서|에게서|한테|에게', 'I heard it from Minsu.'], ['고양이___ 밥을 줬어요.', '한테|에게', 'I fed the cat.'])],
      },
      {
        title: '~지만', meaning: '... but; although ...',
        ex: [['비싸지만 예뻐요.', "It's expensive but pretty."]],
        gen: [clause('but', ['', '비싸다', '예뻐요.', "It's expensive but pretty."], ['한국어는', '어렵다', '재미있어요.', 'Korean is hard but fun.'],
          ['', '맵다', '맛있어요.', "It's spicy but tasty."], ['방이', '작다', '깨끗해요.', 'The room is small but clean.'], ['', '피곤하다', '숙제를 해야 돼요.', "I'm tired but I have to do homework."],
          ['커피는', '좋아하다', '녹차는 안 좋아해요.', "I like coffee but not green tea."], ['학교가', '멀다', '좋아요.', 'School is far but nice.'], ['', '춥다', '날씨가 맑아요.', "It's cold but clear."],
          ['저는', 'N:학생', '일도 해요.', "I'm a student, but I also work."])],
      },
      {
        title: '-아 보세요/-어 보세요', meaning: 'Please try (doing)',
        ex: [['이거 입어 보세요.', 'Try this on.'], ['먹어 보세요.', 'Try it (eat).']],
        gen: [conj('try', 'v', { filter: (v) => vol(v) && hasObj(v), cue: 'please try (아/어 보세요)' })],
      },
      {
        title: '-아 봐도 돼요?/-어 봐도 돼요?', meaning: 'Is it okay to try ~? / May I try ~?',
        ex: [['열어 봐도 돼요? — 네, 열어 보세요.', 'May I open it? — Yes, go ahead.']],
        gen: [(r) => {
          const [frame, d, en] = r.pick([['이거', '열다', 'May I open this?'], ['이 옷', '입다', 'May I try on these clothes?'], ['이거', '먹다', 'May I try this?'],
            ['이 신발', '신다', 'May I try on these shoes?'], ['한 번', '타다', 'May I ride it once?'], ['이거', '마시다', 'May I try this drink?']]);
          const v = verbLike(d);
          return { q: `${frame} ___?`, cue: `${d} → may I try?`, en, a: [inf(v) + ' 봐도 돼요'] };
        }],
      },
      {
        title: 'Casual speech 반말 (-아/어)', meaning: 'With close friends / younger people: drop 요. 이에요/예요 → 이야/야',
        ex: [['뭐 해? — 영화 봐.', 'What are you doing? — Watching a movie.'], ['고마워!', 'Thanks!']],
        gen: [
          (r) => { const v = r.pick(ALL_VERBS); const pol = FORMS.present.make(v)[0]; return { q: `${v.frame} ${pol}`, cue: 'Make it casual (반말)', en: v.en, a: [`${v.frame} ${inf(v)}`, inf(v)] }; },
          S(['고마워요 → casual', '고마워', 'Thanks'], ['뭐 해요? → casual', '뭐 해', 'What are you doing?'], ['미안해요 → casual', '미안해', 'Sorry'],
            ['어디 가요? → casual', '어디 가', 'Where are you going?'], ['학생이에요 → casual', '학생이야', "I'm a student."], ['친구예요 → casual', '친구야', "It's a friend."],
            ['배고파요 → casual', '배고파', "I'm hungry."]),
        ],
      },
    ],
  },
  {
    n: 17, title: '한국말 정말 잘하시네요!', theme: 'Compliments, future plans',
    topics: [
      {
        title: '~을 거예요 / ~ㄹ 거예요', meaning: 'will ~ (prediction; volition / plan)',
        ex: [['내년에 한국에 갈 거예요.', "I'm going to Korea next year."], ['내일 비가 올 거예요.', 'It will rain tomorrow.']],
        gen: [conj('future', 'both', { prefix: '내일', cue: 'will (ㄹ 거예요)' })],
      },
      {
        title: '~지요? / ~죠?', meaning: "Seeking the listener's agreement (right?)",
        ex: [['한국어 어렵지요?', "Korean is hard, isn't it?"], ['날씨 좋죠?', "Nice weather, right?"]],
        gen: [conj('right', 'a', { suffix: '', cue: 'right? (죠?)' }), S(['민수 씨는 한국 사람이___? (right?)', '죠|지요', "Minsu is Korean, right?"])],
      },
      {
        title: '-으로/-로 (means)', meaning: 'by / in / with ~ (instrument, means)',
        ex: [['버스로 가요.', 'I go by bus.'], ['한국말로 말해 보세요.', 'Try saying it in Korean.'], ['젓가락으로 먹어요.', 'I eat with chopsticks.']],
        gen: [(r) => {
          const [n, en, post] = r.pick([['버스', 'by bus', '가요.'], ['지하철', 'by subway', '와요.'], ['택시', 'by taxi', '가요.'], ['비행기', 'by plane', '가요.'],
            ['자전거', 'by bike', '학교에 가요.'], ['한국말', 'in Korean', '말해 보세요.'], ['영어', 'in English', '쓰세요.'], ['젓가락', 'with chopsticks', '먹어요.'],
            ['숟가락', 'with a spoon', '먹어요.'], ['볼펜', 'with a pen', '쓰세요.'], ['연필', 'with a pencil', '써요.'], ['칼', 'with a knife', '잘라요.'],
            ['손', 'by hand', '만들었어요.'], ['이메일', 'by email', '보낼게요.'], ['카드', 'by card', '계산할게요.'], ['현금', 'in cash', '낼게요.'], ['배', 'by boat', '가요.']]);
          return { q: `${n}___ ${post}`, cue: '으로 or 로?', en, a: [after(P.euro(n), n)] };
        }],
      },
      {
        title: '잘해요 / 못해요 / 잘 못해요', meaning: 'Ability: good at / can\'t / not good at. 못 + verb = can\'t',
        ex: [['수영 잘 못해요.', "I'm not good at swimming."]],
        gen: [S(['수영 ___. (not good at)', '잘 못해요', "I'm not good at swimming."], ['요리 ___. (good at)', '잘해요', "I'm good at cooking."],
          ['운전 ___. (can\'t at all)', '못해요', "I can't drive."], ['한국어 ___. (not good at)', '잘 못해요', "I'm not good at Korean."],
          ['노래 ___? (are you good at — honorific)', '잘하세요|잘해요', 'Are you good at singing?'], ['매운 음식을 ___. (먹다 — can\'t)', '못 먹어요', "I can't eat spicy food."],
          ['오늘은 ___. (가다 — can\'t)', '못 가요', "I can't go today."], ['피아노를 ___. (치다 — can\'t)', '못 쳐요', "I can't play piano."])],
      },
      {
        title: '~(으)려고 하다; -(으)려고', meaning: 'intend to ~; intending to / in order to ~',
        ex: [['다음 달에 이사하려고 해요.', "I'm planning to move next month."], ['한국어를 배우려고 왔어요.', 'I came to learn Korean.']],
        gen: [conj('intend', 'v', { prefix: '다음 달에', filter: vol, cue: 'plan to (려고 해요)' }),
          (r) => { const v = r.pick(VERBS.filter((x) => vol(x) && hasObj(x))); return { q: `${v.frame} ___ 왔어요.`, cue: `${v.d} → in order to (려고)`, en: `I came in order to ${v.en.replace(/^to /, '')}.`, a: [eu(v, '', '려고')], note: irrNote(v) }; }],
      },
      {
        title: '~는데도 / ~(으)ㄴ데도 / ~인데도', meaning: 'even though ...; even if ...',
        ex: [['배운 지 오래됐는데도 아직 어려워요.', "Even though I've studied it a long time, it's still hard."]],
        gen: [clause('evenThough', ['열심히', '공부하다', '시험이 어려웠어요.', 'Even though I study hard, the test was hard.'], ['비가', '오다', '축구를 해요.', 'Even though it rains, we play soccer.'],
          ['약을', '먹다', '안 나아요.', "Even though I take medicine, I'm not getting better."], ['', '피곤하다', '일했어요.', 'Even though I was tired, I worked.'],
          ['날씨가', '춥다', '코트를 안 입었어요.', "Even though it's cold, I didn't wear a coat."], ['돈이', '없다', '쇼핑을 해요.', "Even though I have no money, I go shopping."],
          ['많이', '자다', '피곤해요.', "Even though I sleep a lot, I'm tired."], ['', 'N:주말', '일해요.', "Even though it's the weekend, I work."])],
      },
    ],
  },
  {
    n: 18, title: '소개팅 하실래요?', theme: 'Introducing someone, setting an appointment',
    topics: [
      {
        title: 'NOUN 동안; Verb + 는 동안', meaning: 'during / for ~; while ~ing',
        ex: [['방학 동안 일했어요.', 'I worked during vacation.'], ['자는 동안 비가 왔어요.', 'It rained while I was sleeping.']],
        gen: [
          S(['방학 ___ 일했어요.', '동안', 'I worked during vacation.'], ['3년 ___ 한국어를 배웠어요.', '동안', 'I studied Korean for 3 years.'], ['한국에 있는 ___ 친구를 많이 만났어요.', '동안', 'I met many friends while in Korea.']),
          (r) => { const v = r.pick(VERBS.filter((x) => ['기다리다', '요리하다', '운동하다', '공부하다', '걷다', '청소하다', '먹다', '일하다'].includes(x.d))); return { q: `${v.frame} ___ 동안 음악을 들어요.`, cue: `${v.d} → while (는 동안)`, en: `While I ${v.en.replace(/^to /, '')}, I listen to music.`, a: [plain(v, '는')] }; },
        ],
      },
      {
        title: 'Noun-modifying forms of verbs', meaning: '-는 (present), -(으)ㄴ (past), -(으)ㄹ (future) + noun',
        ex: [['저기 있는 사람', 'the person over there'], ['어제 본 영화', 'the movie I saw yesterday'], ['내일 할 일', 'things to do tomorrow']],
        gen: [
          (r) => {
            const v = r.pick(VERBS.filter(hasObj));
            const [k, label, en] = r.pick([['modPresent', 'present (는)', 'who is ~ing'], ['modPast', 'past (은/ㄴ)', 'who ~ed'], ['modFuture', 'future (을/ㄹ)', 'who will ~']]);
            return { q: `${v.frame} ___ 사람`, cue: `${v.d} → ${label}`, en: `the person ${en} (${v.en})`, a: FORMS[k].make(v), note: irrNote(v) };
          },
          S(['어제 ___ 영화 (보다, past)', '본', 'the movie I saw yesterday'], ['내일 ___ 일 (하다, future)', '할', 'things to do tomorrow'],
            ['제가 ___ 음식 (만들다, past)', '만든', 'the food I made'], ['요즘 ___ 책 (읽다, present)', '읽는', 'the book I am reading these days'],
            ['서울에 ___ 친구 (살다, present)', '사는', 'my friend who lives in Seoul'], ['저기 ___ 사람 (있다)', '있는', 'the person over there']),
        ],
      },
      {
        title: 'Noun-modifying forms of adjectives', meaning: '-(으)ㄴ + noun (있다/없다 words take -는)',
        ex: [['키가 큰 사람', 'a tall person'], ['재미있는 사람', 'a fun person']],
        gen: [(r) => {
          const [d, n, en] = r.pick([['크다', '방', 'a big room'], ['맛있다', '음식', 'delicious food'], ['춥다', '날씨', 'cold weather'], ['예쁘다', '꽃', 'a pretty flower'],
            ['재미있다', '영화', 'a fun movie'], ['비싸다', '가방', 'an expensive bag'], ['어렵다', '문제', 'a difficult problem'], ['조용하다', '카페', 'a quiet café'],
            ['길다', '머리', 'long hair'], ['따뜻하다', '커피', 'warm coffee'], ['맵다', '음식', 'spicy food'], ['친절하다', '사람', 'a kind person'],
            ['멀다', '나라', 'a far country'], ['귀엽다', '강아지', 'a cute puppy'], ['하얗다', '눈', 'white snow'], ['빨갛다', '사과', 'a red apple'], ['좋다', '사람', 'a good person'],
            ['쉽다', '시험', 'an easy test'], ['작다', '가방', 'a small bag'], ['바쁘다', '하루', 'a busy day']]);
          const v = verbLike(d);
          return { q: `___ ${n}`, cue: `${d} + ${n}`, en, a: FORMS.modPresent.make(v), note: irrNote(v) };
        }],
      },
      {
        title: 'Describing appearance', meaning: '키가 크다/작다, 머리가 길다/짧다, 안경을 쓰다, 잘생기다',
        ex: [['안경을 쓴 남자예요.', "He's the man wearing glasses."]],
        gen: [S(['키가 ___ 사람이에요. (크다)', '큰', "It's a tall person."], ['머리가 ___ 여자예요. (길다)', '긴', "She's the woman with long hair."],
          ['안경을 ___ 남자예요. (쓰다 — is wearing)', '쓴', "He's the man wearing glasses."], ['정말 ___. (잘생기다 — is handsome)', '잘생겼어요', "He's really handsome."],
          ['키가 ___. (작다)', '작아요', "He's short."], ['머리가 ___ 사람 (짧다)', '짧은', 'a person with short hair'], ['모자를 ___ 사람 (쓰다 — wearing)', '쓴', 'the person wearing a hat'],
          ['눈이 ___. (크다)', '커요', 'Her eyes are big.'])],
      },
      {
        title: '이 / 그 / 저', meaning: 'this / that (near you, or already mentioned) / that over there',
        ex: [['이 사람이 제 친구예요.', 'This person is my friend.']],
        gen: [S(['___ 사람이 제 친구예요. (this)', '이', 'This person is my friend.'], ['___ 건물이 뭐예요? (that over there)', '저', 'What is that building over there?'],
          ['A: 어제 영화 봤어요. B: ___ 영화 재미있었어요? (that — mentioned)', '그', 'Was that movie fun?'], ['___ 가방 얼마예요? (that — near you)', '그', 'How much is that bag (by you)?'],
          ['___ 책 제 거예요. (this)', '이', 'This book is mine.'], ['___ 식당 어때요? (that over there)', '저', 'How about that restaurant over there?'])],
      },
      {
        title: '~거든요', meaning: "It's because ... / ..., you see (giving background)",
        ex: [['못 가요. 약속이 있거든요.', "I can't go. I have plans, you see."]],
        gen: [S(['못 가요. 약속이 ___. (있다)', '있거든요', "I can't go. I have plans, you see."], ['오늘 일찍 자요. 내일 시험이 ___. (있다)', '있거든요', "I'm sleeping early. I have a test tomorrow."],
          ['배고파요. 아침을 안 ___. (먹다, past)', '먹었거든요', "I'm hungry. I didn't eat breakfast, you see."], ['이 식당 자주 와요. 음식이 ___. (맛있다)', '맛있거든요', 'I come here often. The food is good, you see.'],
          ['한국어를 배워요. 한국 드라마를 ___. (좋아하다)', '좋아하거든요', 'I learn Korean. I like Korean dramas, you see.'], ['오늘 기분이 좋아요. 제 생일___. (이다)', '이거든요', "I'm in a good mood. It's my birthday."],
          ['택시 타요. 시간이 ___. (없다)', '없거든요', "I'm taking a taxi. I don't have time."], ['오늘 못 만나요. 좀 ___. (바쁘다)', '바쁘거든요', "I can't meet today. I'm a bit busy."])],
      },
    ],
  },
  {
    n: 19, title: '시간 있으면 보통 뭐 하세요?', theme: 'Hobbies',
    topics: [
      {
        title: '-다가', meaning: 'while doing A, switch to B (transition between events)',
        ex: [['공부하다가 잤어요.', 'I was studying and fell asleep.'], ['가다가 친구를 만났어요.', 'On the way, I ran into a friend.']],
        gen: [clause('while', ['', '공부하다', '잤어요.', 'I was studying and fell asleep.'], ['학교에', '가다', '친구를 만났어요.', 'On the way to school I met a friend.'],
          ['텔레비전을', '보다', '잠이 들었어요.', 'I fell asleep watching TV.'], ['밥을', '먹다', '전화를 받았어요.', 'I was eating and took a call.'],
          ['책을', '읽다', '나갔어요.', 'I was reading and then went out.'], ['길을', '걷다', '넘어졌어요.', 'I was walking and fell.'], ['일을', '하다', '쉬었어요.', 'I was working and took a break.'],
          ['집에', '오다', '빵을 샀어요.', 'On the way home I bought bread.'])],
      },
      {
        title: '어떤 + NOUN', meaning: 'which / what kind of ~; some / any ~',
        ex: [['어떤 음악 좋아하세요?', 'What kind of music do you like?']],
        gen: [S(['___ 음악 좋아하세요?', '어떤', 'What kind of music do you like?'], ['___ 사람이에요? (what kind of person)', '어떤', 'What kind of person is he/she?'],
          ['___ 영화를 좋아해요?', '어떤', 'What kind of movies do you like?'], ['___ 음식이 제일 맛있어요?', '어떤', 'Which food is the tastiest?'], ['___ 스타일 좋아하세요?', '어떤', 'What style do you like?'])],
      },
      {
        title: 'Formal -습니다 style', meaning: 'Formal polite: -습니다/-ㅂ니다; questions -습니까/-ㅂ니까?',
        ex: [['감사합니다.', 'Thank you.'], ['무엇을 좋아합니까?', 'What do you like?']],
        gen: [conj('formal', 'both', { cue: 'formal (습니다)' }), conj('formalQ', 'both', { cue: 'formal question (습니까?)', suffix: '?' }),
          S(['감사___.', '합니다', 'Thank you.'], ['처음 뵙겠___.', '습니다', 'Nice to meet you (first time).'], ['만나서 반갑___.', '습니다', 'Nice to meet you.'],
            ['저는 학생___. (formal 이다)', '입니다', 'I am a student.'], ['이름이 무엇___? (formal question)', '입니까', 'What is your name?'])],
      },
      {
        title: '-겠-', meaning: 'must be ~ (supposition from what you see / hear)',
        ex: [['재미있겠어요!', 'That must be fun!'], ['힘들겠어요.', 'That must be hard.']],
        gen: [conj('guess', 'a', { suffix: '!', cue: 'must be (겠어요)' })],
      },
      {
        title: 'Frequency expressions', meaning: '항상, 자주, 보통, 가끔, 별로 (안), 전혀 (안); 일주일에 한 번',
        ex: [['가끔 등산해요.', 'I sometimes go hiking.']],
        gen: [S(['저는 ___ 운동해요. (always)', '항상|늘|언제나', 'I always exercise.'], ['___ 등산해요. (sometimes)', '가끔', 'I sometimes go hiking.'],
          ['커피를 ___ 마셔요. (often)', '자주', 'I often drink coffee.'], ['주말에 ___ 집에 있어요. (usually)', '보통', "I'm usually at home on weekends."],
          ['고기를 ___ 안 먹어요. (not really)', '별로', "I don't really eat meat."], ['술을 ___ 안 마셔요. (not at all)', '전혀', "I don't drink at all."],
          ['일주일에 ___ 수영해요. (twice)', '두 번', 'I swim twice a week.'], ['한 달에 ___ 영화를 봐요. (once)', '한 번', 'I see a movie once a month.'],
          ['하루에 ___ 커피를 마셔요. (three times)', '세 번', 'I drink coffee three times a day.'])],
      },
      {
        title: '-도 하고 -도 하고', meaning: 'do NOUN 1 and NOUN 2 as well',
        ex: [['주말에 운동도 하고 요리도 해요.', 'On weekends I exercise and cook too.']],
        gen: [(r) => {
          const acts = [['운동', 'exercise'], ['요리', 'cook'], ['청소', 'clean'], ['공부', 'study'], ['쇼핑', 'shop'], ['숙제', 'do homework'], ['빨래', 'do laundry'], ['산책', 'take walks'], ['게임', 'play games'], ['여행', 'travel']];
          const [a, ae] = r.pick(acts); let b; let be; do { [b, be] = r.pick(acts); } while (b === a);
          return r.chance(0.5)
            ? { q: `주말에 ${a}___ 하고 ${b}도 해요.`, cue: 'also', en: `On weekends I ${ae} and ${be}.`, a: ['도'] }
            : { q: '', cue: `Say: On weekends I ${ae} and also ${be}. (${a}, ${b})`, en: '', a: [`주말에 ${a}도 하고 ${b}도 해요`, `${a}도 하고 ${b}도 해요`] };
        }],
      },
    ],
  },
  {
    n: 20, title: '지난번 소개팅은 어땠어요?', theme: 'Explaining a situation, making an offer',
    topics: [
      {
        title: '주다 / 주시다 / 드리다', meaning: 'to give: plain / honorific giver / humble (giving to someone senior)',
        ex: [['할머니께 꽃을 드렸어요.', 'I gave Grandma flowers.']],
        gen: [S(['할머니께 꽃을 ___. (gave — humble)', '드렸어요', 'I gave flowers to Grandma.'], ['동생한테 책을 ___. (gave)', '줬어요|주었어요', 'I gave my sibling a book.'],
          ['선생님이 저한테 선물을 ___. (gave — honorific)', '주셨어요', 'The teacher gave me a gift.'], ['부모님께 선물을 ___. (will give — humble)', '드릴 거예요|드릴게요', "I'll give my parents a present."],
          ['친구한테 꽃을 ___. (gave)', '줬어요|주었어요', 'I gave flowers to a friend.'], ['할아버지가 용돈을 ___. (gave — honorific)', '주셨어요', 'Grandpa gave me pocket money.'])],
      },
      {
        title: '-아/어 주다, 주시다, 드리다', meaning: 'to do something for someone',
        ex: [['도와 드릴까요?', 'Shall I help you?'], ['사진 좀 찍어 주세요.', 'Please take a photo for me.']],
        gen: [conj('forYou', 'v', { filter: (v) => vol(v) && hasObj(v), cue: 'please do it for me (아/어 주세요)' }),
          S(['제가 도와 ___? (Shall I help you? humble)', '드릴까요', 'Shall I help you?'], ['사진 좀 찍어 ___.', '주세요', 'Please take a photo for me.'],
            ['엄마가 김밥을 만들어 ___. (made for me — honorific)', '주셨어요', 'Mom made gimbap for me.'], ['제가 가방을 들어 ___. (I\'ll carry it for you — humble)', '드릴게요', "I'll carry your bag."])],
      },
      {
        title: '-기로 하다', meaning: 'to decide / agree to ~',
        ex: [['주말에 다시 만나기로 했어요.', 'We decided to meet again on the weekend.']],
        gen: [conj('decided', 'v', { prefix: '주말에', filter: (v) => vol(v) && hasObj(v), cue: 'decided to (기로 했어요)' })],
      },
      {
        title: '-을/를 하다 vs. -이/가 되다', meaning: '(someone) does something vs. (something) gets done / becomes',
        ex: [['예약을 했어요.', 'I made a reservation.'], ['예약이 됐어요.', 'The reservation is made.']],
        gen: [S(['예약을 ___. (I made a reservation)', '했어요', 'I made a reservation.'], ['예약이 ___. (the reservation is done)', '됐어요|되었어요', 'The reservation is made.'],
          ['수업이 ___. (class started — 시작)', '시작됐어요|시작되었어요|시작했어요', 'Class has started.'], ['선생님이 수업을 ___. (started — 시작)', '시작했어요', 'The teacher started class.'],
          ['일이 다 ___. (the work is done)', '됐어요|되었어요', 'The work is all done.'], ['저는 의사가 ___. (became)', '됐어요|되었어요', 'I became a doctor.'],
          ['예약___ 됐어요.', '이', 'The reservation is made.'], ['예약___ 했어요.', '을', 'I made a reservation.'])],
      },
      {
        title: '지난 / 이번 / 다음 + NOUN', meaning: 'last / this / next ~',
        ex: [['지난주, 이번 달, 다음 주말', 'last week, this month, next weekend']],
        gen: [S(['___ 주에 만났어요. (last)', '지난', 'We met last week.'], ['___ 달에 이사할 거예요. (next)', '다음', "I'll move next month."],
          ['___ 주말에 뭐 해요? (this)', '이번', 'What are you doing this weekend?'], ['___번 소개팅은 어땠어요? (last time)', '지난', 'How was the blind date last time?'],
          ['___ 학기에 한국어를 배워요. (this semester)', '이번', "I'm learning Korean this semester."], ['___ 주에 봐요! (next)', '다음', 'See you next week!'],
          ['___ 달에 바빴어요. (last)', '지난', 'I was busy last month.'])],
      },
    ],
  },
];

// Assign stable ids: "L.T" e.g. "4.3"
for (const l of LESSONS) l.topics.forEach((t, i) => { t.id = `${l.n}.${i + 1}`; t.lesson = l.n; });

export const ALL_TOPICS = LESSONS.flatMap((l) => l.topics);
export const topicById = (id) => ALL_TOPICS.find((t) => t.id === id);

/** Generate one question for a topic, retrying a few times if a generator fails. */
export function makeQuestion(topic, r) {
  for (let i = 0; i < 5; i++) {
    try {
      const q = r.pick(topic.gen)(r);
      if (q && q.a && q.a.length && q.a[0]) return { ...q, topicId: topic.id, topicTitle: topic.title };
    } catch (e) {
      console.warn('generator failed', topic.id, e);
    }
  }
  return null;
}

