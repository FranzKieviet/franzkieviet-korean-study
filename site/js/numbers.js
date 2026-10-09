// Sino-Korean & native Korean numbers, dates, times, money, phone numbers.

const SINO_DIGITS = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
const NATIVE_ONES = ['', '하나', '둘', '셋', '넷', '다섯', '여섯', '일곱', '여덟', '아홉'];
const NATIVE_TENS = ['', '열', '스물', '서른', '마흔', '쉰', '예순', '일흔', '여든', '아흔'];
const COUNTER_FORM = { 하나: '한', 둘: '두', 셋: '세', 넷: '네' };

function group4(n) {
  // 0..9999 → e.g. 3045 → 삼천사십오 (1 is silent before 십/백/천)
  const units = ['천', '백', '십', ''];
  const digits = String(n).padStart(4, '0').split('').map(Number);
  let out = '';
  digits.forEach((d, i) => {
    if (!d) return;
    out += (d === 1 && i < 3 ? '' : SINO_DIGITS[d]) + units[i];
  });
  return out;
}

/** Sino-Korean number, groups separated by spaces (만 오천). */
export function sino(n) {
  n = Math.floor(n);
  if (n === 0) return '영';
  const bigUnits = ['', '만', '억', '조'];
  const parts = [];
  let k = 0;
  while (n > 0) {
    const g = n % 10000;
    if (g) {
      // 10000 is 만, not 일만 (but 억 keeps 일)
      const word = k === 1 && g === 1 ? '' : group4(g);
      parts.unshift(word + bigUnits[k]);
    }
    n = Math.floor(n / 10000);
    k++;
  }
  return parts.join(' ');
}

/** Native Korean number 1..99 (dictionary form: 하나, 스물셋) */
export function native(n) {
  return NATIVE_TENS[Math.floor(n / 10)] + NATIVE_ONES[n % 10];
}

/** Native number before a counter: 한, 두, 세, 네, 스무 */
export function nativeCounter(n) {
  if (n === 20) return '스무';
  const ones = NATIVE_ONES[n % 10];
  return NATIVE_TENS[Math.floor(n / 10)] + (COUNTER_FORM[ones] || ones);
}

export const DAYS = [
  ['월요일', 'Monday'], ['화요일', 'Tuesday'], ['수요일', 'Wednesday'], ['목요일', 'Thursday'],
  ['금요일', 'Friday'], ['토요일', 'Saturday'], ['일요일', 'Sunday'],
];
export const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function month(m) {
  if (m === 6) return '유월';
  if (m === 10) return '시월';
  return sino(m) + '월';
}

export function time(h, m) {
  const hour = nativeCounter(h) + ' 시';
  if (m === 0) return [hour];
  const full = `${hour} ${sino(m)} 분`;
  return m === 30 ? [full, `${hour} 반`] : [full];
}

export function phone(str) {
  const read = (s) => s.split('').map((d) => (d === '0' ? '공' : SINO_DIGITS[+d])).join('');
  const parts = str.split('-').map(read);
  return [parts.join(' 에 '), parts.join(' ')];
}

const fmt = (n) => n.toLocaleString('en-US');

// ---------- Practice item generators ----------
// Each returns { show, ko: [answers], num: [answers], speak, en? }
export const NUM_CATEGORIES = {
  sinoSmall: {
    label: 'Sino-Korean 0–100', note: '일, 이, 삼…',
    gen: (r) => { const n = r.int(0, 100); return { show: String(n), ko: [sino(n)], num: [String(n)], speak: sino(n) }; },
  },
  sinoBig: {
    label: 'Sino-Korean 100–99,999', note: '백, 천, 만',
    gen: (r) => {
      const n = r.chance(0.5) ? r.int(100, 9999) : r.int(10, 9999) * 10;
      return { show: fmt(n), ko: [sino(n)], num: [String(n)], speak: sino(n) };
    },
  },
  sinoHuge: {
    label: 'Big numbers (만, 억)', note: 'up to 10억',
    gen: (r) => {
      const n = r.pick([r.int(1, 999) * 10000, r.int(10, 9999) * 1000, r.int(1, 99) * 1000000, r.int(1, 9) * 100000000 + r.int(0, 9999) * 10000]);
      return { show: fmt(n), ko: [sino(n)], num: [String(n)], speak: sino(n) };
    },
  },
  native: {
    label: 'Native Korean 1–99', note: '하나, 둘, 셋…',
    gen: (r) => { const n = r.chance(0.6) ? r.int(1, 20) : r.int(21, 99); return { show: String(n), ko: [native(n)], num: [String(n)], speak: native(n) }; },
  },
  counters: {
    label: 'Counters (명, 개, 잔, 병, 권, 마리)', note: '한 명, 두 개…',
    gen: (r) => {
      const [c, en] = r.pick([['명', 'people'], ['개', 'things'], ['잔', 'cups'], ['병', 'bottles'], ['권', 'books'], ['마리', 'animals'], ['장', 'sheets']]);
      const n = r.chance(0.7) ? r.int(1, 12) : r.int(13, 40);
      const ko = `${nativeCounter(n)} ${c}`;
      return { show: `${n}${c}`, ko: [ko], num: [String(n)], speak: ko, en: `${n} ${en}` };
    },
  },
  age: {
    label: 'Age (살)', note: '스물다섯 살',
    gen: (r) => { const n = r.int(1, 99); const ko = `${nativeCounter(n)} 살`; return { show: `${n}살`, ko: [ko], num: [String(n)], speak: ko }; },
  },
  money: {
    label: 'Money (원)', note: '만 오천 원',
    gen: (r) => {
      const n = r.pick([r.int(1, 99) * 100, r.int(1, 99) * 500, r.int(1, 200) * 1000, r.int(1, 50) * 10000, r.int(10, 999) * 100]);
      const ko = `${sino(n)} 원`;
      return { show: `${fmt(n)}원`, ko: [ko], num: [String(n)], speak: ko };
    },
  },
  time: {
    label: 'Time (시/분)', note: 'native hours + Sino minutes',
    gen: (r) => {
      const h = r.int(1, 12);
      const m = r.pick([0, 30, 15, 45, r.int(1, 59), r.int(1, 59), 10, 20, 50]);
      const ko = time(h, m);
      const mm = String(m).padStart(2, '0');
      return { show: `${h}:${mm}`, ko, num: [`${h}${mm}`, m === 0 ? String(h) : `${h}${mm}`], speak: ko[0] };
    },
  },
  dates: {
    label: 'Dates (월/일)', note: '유월, 시월!',
    gen: (r) => {
      const mo = r.chance(0.35) ? r.pick([6, 10]) : r.int(1, 12);
      const d = r.int(1, 31 - (mo === 2 ? 3 : 0));
      const ko = `${month(mo)} ${sino(d)} 일`;
      return { show: `${mo}월 ${d}일`, ko: [ko], num: [`${mo}/${d}`, `${mo}${d}`], speak: ko, en: `${MONTHS_EN[mo - 1]} ${d}` };
    },
  },
  years: {
    label: 'Years (년)', note: '이천이십육 년',
    gen: (r) => {
      const y = r.chance(0.6) ? r.int(1990, 2035) : r.int(1900, 2099);
      const ko = `${sino(y)} 년`;
      return { show: `${y}년`, ko: [ko], num: [String(y)], speak: ko };
    },
  },
  days: {
    label: 'Days of the week', note: '월요일…일요일',
    gen: (r) => {
      const [ko, en] = r.pick(DAYS);
      return { show: en, ko: [ko], num: [en.toLowerCase(), en.slice(0, 3).toLowerCase()], speak: ko, numLabel: 'English day' };
    },
  },
  months: {
    label: 'Months', note: '일월…십이월',
    gen: (r) => {
      const m = r.chance(0.3) ? r.pick([6, 10]) : r.int(1, 12);
      const en = MONTHS_EN[m - 1];
      return { show: en, ko: [month(m)], num: [String(m), en.toLowerCase(), en.slice(0, 3).toLowerCase()], speak: month(m), numLabel: 'month number' };
    },
  },
  phone: {
    label: 'Phone numbers', note: '공일공에…',
    gen: (r) => {
      const d4 = () => String(r.int(0, 9999)).padStart(4, '0');
      const p = `010-${d4()}-${d4()}`;
      const ko = phone(p);
      return { show: p, ko, num: [p.replace(/-/g, '')], speak: ko[0] };
    },
  },
};
