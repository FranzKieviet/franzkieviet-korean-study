// Word banks used to generate sentences and conjugation drills.
// Verb: [dictionary form, English, frame (words before the verb), irregular type]

const V = (d, en, frame, irr) => ({ d, en, frame, irr, t: 'v' });
const A = (d, en, frame, irr) => ({ d, en, frame, irr, t: 'a' });

export const VERBS = [
  V('먹다', 'to eat', '빵을'), V('마시다', 'to drink', '커피를'), V('보다', 'to watch / see', '영화를'),
  V('읽다', 'to read', '책을'), V('가다', 'to go', '학교에'), V('오다', 'to come', '집에'),
  V('공부하다', 'to study', '한국어를'), V('만나다', 'to meet', '친구를'), V('사다', 'to buy', '옷을'),
  V('듣다', 'to listen', '음악을', 'ㄷ'), V('만들다', 'to make', '김밥을'), V('살다', 'to live', '서울에'),
  V('배우다', 'to learn', '태권도를'), V('기다리다', 'to wait', '버스를'), V('자다', 'to sleep', '일찍'),
  V('일하다', 'to work', '회사에서'), V('운동하다', 'to exercise', '공원에서'), V('쓰다', 'to write', '편지를'),
  V('앉다', 'to sit', '여기에'), V('입다', 'to wear (clothes)', '코트를'), V('걷다', 'to walk', '공원에서', 'ㄷ'),
  V('놀다', 'to play / hang out', '친구하고'), V('열다', 'to open', '창문을'), V('찍다', 'to take (a photo)', '사진을'),
  V('부르다', 'to sing / call out', '노래를', '르'), V('타다', 'to ride / take', '버스를'), V('요리하다', 'to cook', '집에서'),
  V('전화하다', 'to call', '엄마한테'), V('청소하다', 'to clean', '방을'), V('씻다', 'to wash', '손을'),
  V('팔다', 'to sell', '과일을'), V('돕다', 'to help', '친구를', 'ㅂ'), V('쉬다', 'to rest', '집에서'),
  V('보내다', 'to send', '메시지를'), V('빌리다', 'to borrow', '책을'), V('가르치다', 'to teach', '영어를'),
  V('닫다', 'to close', '문을'), V('받다', 'to receive', '선물을'), V('알다', 'to know', '그 사람을'),
  V('모르다', 'to not know', '답을', '르'), V('묻다', 'to ask', '길을', 'ㄷ'), V('고르다', 'to choose', '선물을', '르'),
  V('짓다', 'to build / make up', '집을', 'ㅅ'), V('일어나다', 'to get up', '일곱 시에'), V('좋아하다', 'to like', '커피를'),
  V('싫어하다', 'to dislike', '오이를'), V('다니다', 'to attend / go regularly', '회사에'), V('끄다', 'to turn off', '불을'),
  V('켜다', 'to turn on', '텔레비전을'), V('주다', 'to give', '동생한테'), V('말하다', 'to speak', '한국말로'),
  V('웃다', 'to laugh', '많이'), V('울다', 'to cry', '많이'), V('시작하다', 'to start', '수업을'),
  V('춤추다', 'to dance', '같이'), V('찾다', 'to look for', '지갑을'), V('잊다', 'to forget', '약속을'),
  V('신다', 'to wear (shoes)', '운동화를'), V('벗다', 'to take off', '신발을'), V('나가다', 'to go out', '밖에'),
  V('들어가다', 'to go in', '방에'), V('끝나다', 'to end', '수업이'), V('여행하다', 'to travel', '한국을'),
  V('이사하다', 'to move (house)', '부산으로'), V('자르다', 'to cut', '머리를', '르'), V('낫다', 'to get better', '감기가', 'ㅅ'),
];

export const ADJECTIVES = [
  A('좋다', 'to be good', '날씨가'), A('크다', 'to be big', '방이'), A('작다', 'to be small', '방이'),
  A('많다', 'to be many', '사람이'), A('비싸다', 'to be expensive', '가방이'), A('싸다', 'to be cheap', '과일이'),
  A('맛있다', 'to be delicious', '김밥이'), A('재미있다', 'to be fun', '한국어가'), A('재미없다', 'to be boring', '영화가'),
  A('바쁘다', 'to be busy', '요즘'), A('아프다', 'to be sick / hurt', '머리가'), A('예쁘다', 'to be pretty', '꽃이'),
  A('덥다', 'to be hot (weather)', '오늘은', 'ㅂ'), A('춥다', 'to be cold (weather)', '날씨가', 'ㅂ'),
  A('쉽다', 'to be easy', '시험이', 'ㅂ'), A('어렵다', 'to be difficult', '숙제가', 'ㅂ'),
  A('가깝다', 'to be close', '집이', 'ㅂ'), A('맵다', 'to be spicy', '김치가', 'ㅂ'), A('귀엽다', 'to be cute', '강아지가', 'ㅂ'),
  A('무겁다', 'to be heavy', '가방이', 'ㅂ'), A('가볍다', 'to be light', '노트북이', 'ㅂ'), A('뜨겁다', 'to be hot (to touch)', '커피가', 'ㅂ'),
  A('차갑다', 'to be cold (to touch)', '물이', 'ㅂ'), A('멀다', 'to be far', '학교가'), A('길다', 'to be long', '머리가'),
  A('빠르다', 'to be fast', '지하철이', '르'), A('다르다', 'to be different', '생각이', '르'),
  A('배고프다', 'to be hungry', '지금'), A('피곤하다', 'to be tired', '오늘은'), A('따뜻하다', 'to be warm', '방이'),
  A('시원하다', 'to be cool / refreshing', '바람이'), A('깨끗하다', 'to be clean', '방이'), A('조용하다', 'to be quiet', '도서관이'),
  A('행복하다', 'to be happy', '요즘'), A('슬프다', 'to be sad', '영화가'), A('기쁘다', 'to be glad', '정말'),
  A('친절하다', 'to be kind', '선생님이'), A('젊다', 'to be young', '어머니가'), A('짧다', 'to be short (length)', '머리가'),
  A('높다', 'to be high / tall', '건물이'), A('짜다', 'to be salty', '국이'), A('달다', 'to be sweet', '케이크가'),
  A('좁다', 'to be narrow', '길이'), A('넓다', 'to be wide', '방이'), A('적다', 'to be few', '사람이'),
  A('그렇다', 'to be so / like that', '정말', 'ㅎ'), A('빨갛다', 'to be red', '사과가', 'ㅎ'), A('하얗다', 'to be white', '눈이', 'ㅎ'),
];

export const ALL_VERBS = [...VERBS, ...ADJECTIVES];

export const IRR_LABEL = {
  ㅂ: 'ㅂ irregular (ㅂ → 우)', ㄷ: 'ㄷ irregular (ㄷ → ㄹ before a vowel)', ㅅ: 'ㅅ irregular (ㅅ drops before a vowel)',
  르: '르 irregular (르 → ㄹ라/ㄹ러)', ㅎ: 'ㅎ irregular (ㅎ drops; 그렇 → 그래)',
};

export function irrNote(v) {
  if (v.irr) return IRR_LABEL[v.irr];
  const s = v.d.slice(0, -1);
  const last = s[s.length - 1];
  if (last === '하') return '하다 → 해';
  const code = last.charCodeAt(0) - 0xac00;
  if (code % 28 === 8) return 'ㄹ stem (ㄹ drops before ㄴ, ㅂ, ㅅ)';
  if (code % 28 === 0 && Math.floor((code % 588) / 28) === 18) return 'ㅡ drops before 아/어';
  return '';
}

export const PEOPLE = [['학생', 'student'], ['선생님', 'teacher'], ['의사', 'doctor'], ['요리사', 'chef'], ['회사원', 'office worker'],
  ['가수', 'singer'], ['간호사', 'nurse'], ['경찰', 'police officer'], ['변호사', 'lawyer'], ['대학생', 'college student'],
  ['기자', 'reporter'], ['배우', 'actor'], ['군인', 'soldier'], ['작가', 'writer'], ['디자이너', 'designer'], ['엔지니어', 'engineer'],
  ['은행원', 'bank teller'], ['유학생', 'international student'], ['교수', 'professor'], ['프로그래머', 'programmer']];

export const THINGS = [['책', 'book'], ['커피', 'coffee'], ['물', 'water'], ['사과', 'apple'], ['빵', 'bread'], ['핸드폰', 'cell phone'],
  ['가방', 'bag'], ['우산', 'umbrella'], ['컴퓨터', 'computer'], ['시계', 'watch'], ['연필', 'pencil'], ['김밥', 'gimbap'],
  ['우유', 'milk'], ['신발', 'shoes'], ['모자', 'hat'], ['지갑', 'wallet'], ['의자', 'chair'], ['노트북', 'laptop'],
  ['안경', 'glasses'], ['열쇠', 'key'], ['카메라', 'camera'], ['볼펜', 'pen'], ['공책', 'notebook'], ['선물', 'gift']];

export const PLACES = [['학교', 'school'], ['집', 'home'], ['도서관', 'library'], ['카페', 'café'], ['식당', 'restaurant'],
  ['회사', 'the office'], ['병원', 'hospital'], ['은행', 'bank'], ['기숙사', 'dorm'], ['공원', 'park'], ['시장', 'market'],
  ['영화관', 'movie theater'], ['편의점', 'convenience store'], ['백화점', 'department store'], ['우체국', 'post office'],
  ['서점', 'bookstore'], ['헬스장', 'gym'], ['교회', 'church'], ['공항', 'airport'], ['수영장', 'swimming pool']];

export const COUNTRIES = [['미국', 'American'], ['한국', 'Korean'], ['중국', 'Chinese'], ['일본', 'Japanese'], ['영국', 'British'],
  ['독일', 'German'], ['프랑스', 'French'], ['캐나다', 'Canadian'], ['호주', 'Australian'], ['베트남', 'Vietnamese'],
  ['네덜란드', 'Dutch'], ['멕시코', 'Mexican'], ['브라질', 'Brazilian'], ['스페인', 'Spanish'], ['인도', 'Indian']];

export const NAMES = ['민수', '제니', '지민', '유나', '서준', '하은', '마이클', '소피아', '준호', '수진', '다니엘', '지훈', '은지', '톰', '사라'];

export const FOODS = [['김밥', 'gimbap'], ['비빔밥', 'bibimbap'], ['불고기', 'bulgogi'], ['떡볶이', 'tteokbokki'], ['라면', 'ramen'],
  ['김치찌개', 'kimchi stew'], ['냉면', 'cold noodles'], ['피자', 'pizza'], ['치킨', 'fried chicken'], ['삼겹살', 'pork belly'],
  ['샐러드', 'salad'], ['만두', 'dumplings'], ['된장찌개', 'soybean paste stew'], ['파전', 'green onion pancake']];

export const DRINKS = [['커피', 'coffee'], ['녹차', 'green tea'], ['우유', 'milk'], ['주스', 'juice'], ['물', 'water'],
  ['콜라', 'cola'], ['라테', 'latte'], ['맥주', 'beer'], ['아이스티', 'iced tea']];

export const findVerb = (d) => ALL_VERBS.find((v) => v.d === d) || { d, t: 'v', en: '' };
