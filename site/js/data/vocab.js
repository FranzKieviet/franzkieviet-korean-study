// Daily vocabulary (5 per day, in order of everyday usefulness) and weekly hanja (5 per Sunday).

const RAW_WORDS = `
오늘|today
내일|tomorrow
어제|yesterday
지금|now
나중에|later
아침|morning; breakfast
점심|lunch; midday
저녁|evening; dinner
밤|night
주말|weekend
매일|every day
항상|always
가끔|sometimes
자주|often
벌써|already
아직|still; (not) yet
다시|again
같이|together
혼자|alone
먼저|first; ahead
빨리|quickly
천천히|slowly
조금|a little
많이|a lot
너무|too; very
정말|really
진짜|really (casual)
아주|very
제일|the most
거의|almost
괜찮다|to be okay
필요하다|to need; to be necessary
중요하다|to be important
편하다|to be comfortable / convenient
불편하다|to be uncomfortable / inconvenient
시작하다|to start
끝나다|to end
기억하다|to remember
잊어버리다|to forget
생각하다|to think
준비하다|to prepare
연습하다|to practice
설명하다|to explain
이해하다|to understand
대답하다|to answer
물어보다|to ask
찾다|to look for; to find
잃어버리다|to lose (something)
고치다|to fix
바꾸다|to change; to exchange
도착하다|to arrive
출발하다|to depart
늦다|to be late
일찍|early
걸리다|to take (time); to catch (a cold)
갈아타다|to transfer (bus/subway)
내리다|to get off; to fall (rain/snow)
타다|to get on; to ride
지나다|to pass
돌아가다|to go back
왼쪽|left side
오른쪽|right side
앞|front
뒤|back; behind
옆|side; next to
위|top; above
아래|bottom; below
안|inside
밖|outside
근처|nearby
길|road; way
건물|building
입구|entrance
출구|exit
화장실|bathroom
얼마예요?|How much is it?
계산하다|to pay (the bill)
영수증|receipt
할인|discount
현금|cash
가격|price
거스름돈|change (money back)
주문하다|to order
메뉴|menu
포장|takeout; wrapping
배달|delivery
반찬|side dishes
맛|taste; flavor
맵다|to be spicy
짜다|to be salty
달다|to be sweet
싱겁다|to be bland
배부르다|to be full (stomach)
목마르다|to be thirsty
졸리다|to be sleepy
심심하다|to be bored
힘들다|to be hard; to be tiring
기분|mood; feeling
걱정|worry
스트레스|stress
화나다|to get angry
놀라다|to be surprised
무섭다|to be scary; to be scared
부끄럽다|to be shy; to be embarrassed
웃다|to laugh; to smile
울다|to cry
감기|a cold (illness)
열|fever; ten (native)
기침|cough
약|medicine
약국|pharmacy
머리|head; hair
눈|eye; snow
코|nose
입|mouth
귀|ear
손|hand
발|foot
다리|leg; bridge
배|stomach; boat; pear
어깨|shoulder
옷|clothes
바지|pants
치마|skirt
양말|socks
신발|shoes
날씨|weather
비|rain
바람|wind
구름|cloud
안개|fog
봄|spring
여름|summer
가을|autumn
겨울|winter
계절|season
하늘|sky
바다|sea
산|mountain
강|river
나무|tree
꽃|flower
동물|animal
강아지|puppy
고양이|cat
새|bird; new
가족|family
부모님|parents
아내|wife
남편|husband
아이|child
이웃|neighbor
손님|guest; customer
어른|adult; elder
나이|age
이름|name
회의|meeting
출근하다|to go to work
퇴근하다|to leave work
휴가|vacation (from work)
월급|monthly salary
직업|job; occupation
동료|coworker
사장님|boss; company president
이메일|email
숙제|homework
시험|exam
질문|question
대답|answer
문제|problem; question (on a test)
단어|word
문장|sentence
뜻|meaning
발음|pronunciation
문법|grammar
쉽다|to be easy
어렵다|to be difficult
지루하다|to be boring
유명하다|to be famous
재미있다|to be fun; interesting
처음|the first time; beginning
마지막|last; final
다음|next
지난|last; past (지난주)
이번|this (time)
약속|appointment; promise
계획|plan
예약|reservation
취소하다|to cancel
연락하다|to contact
전화|phone call; telephone
문자|text message
사진|photo
영상|video
인터넷|internet
방|room
부엌|kitchen
거실|living room
침대|bed
창문|window
책상|desk
냉장고|refrigerator
에어컨|air conditioner
청소|cleaning
빨래|laundry
설거지|washing dishes
요리|cooking; dish
쓰레기|trash
시간|time; hour
분|minute
초|second
반|half; class
날|day
주|week
달|month; moon
해|year; sun
생일|birthday
돈|money
지갑|wallet
은행|bank
모으다|to save up; to collect
쓰다|to use; to spend; to write
여행|travel; trip
비행기|airplane
공항|airport
여권|passport
호텔|hotel
지하철|subway
역|station
정류장|bus stop
표|ticket
자리|seat; spot
줄|line (queue); string
번호|number
층|floor; story
물건|thing; item
선물|gift
우산|umbrella
열쇠|key
맞다|to be correct; to fit
틀리다|to be wrong
다르다|to be different
같다|to be the same
비슷하다|to be similar
원하다|to want
바라다|to hope; to wish
믿다|to believe; to trust
보이다|to be seen; to show
들리다|to be heard; to drop by
느끼다|to feel
냄새|smell
소리|sound
누르다|to press
들다|to lift; to hold
놓다|to put; to place
넣다|to put in
꺼내다|to take out
빌리다|to borrow
빌려주다|to lend
돌려주다|to give back
고르다|to choose
입어 보다|to try on (clothes)
환불|refund
혹시|by any chance
아마|probably; maybe
물론|of course
그래서|so; therefore
그런데|but; by the way
그리고|and
하지만|however
그러면|then; if so
왜냐하면|because
그래도|even so; still
누구|who
언제|when
어디|where
왜|why
어떻게|how
무엇|what
얼마나|how much; how long
몇|how many; what (number)
어느|which
어떤|what kind of
감사합니다|thank you
죄송합니다|I'm sorry (formal)
실례합니다|excuse me
잘 먹겠습니다|(said before eating) Thanks for the food
잘 먹었습니다|(said after eating) I enjoyed the meal
수고하셨습니다|thanks for your hard work
축하해요|congratulations
어서 오세요|welcome
글쎄요|well... / let me see
그렇군요|I see
가깝다|to be near
멀다|to be far
넓다|to be spacious; wide
좁다|to be narrow; cramped
깨끗하다|to be clean
더럽다|to be dirty
조용하다|to be quiet
시끄럽다|to be noisy
밝다|to be bright
어둡다|to be dark
따뜻하다|to be warm
시원하다|to be cool; refreshing
뜨겁다|to be hot (to the touch)
차갑다|to be cold (to the touch)
새롭다|to be new
오래되다|to be old (things)
젊다|to be young
멋있다|to be cool; stylish
귀엽다|to be cute
잘생기다|to be good-looking
친절하다|to be kind
착하다|to be good-natured
한가하다|to be free (not busy)
건강하다|to be healthy
아프다|to be sick; to hurt
산책|a walk
등산|hiking
수영|swimming
축구|soccer
운동|exercise
음악|music
영화|movie
드라마|TV drama
노래|song
게임|game
신문|newspaper
잡지|magazine
소설|novel
만화|comics; cartoon
대학교|university
교실|classroom
수업|class; lesson
병원|hospital
의사|doctor
주소|address
전화번호|phone number
고향|hometown
나라|country
외국|foreign country
외국인|foreigner
언어|language
말|speech; words; horse
글|writing; text
이야기|story; talk
뉴스|news
날짜|date
요일|day of the week
오전|a.m.; morning
오후|p.m.; afternoon
새벽|dawn; early morning
매주|every week
매달|every month
작년|last year
올해|this year
내년|next year
옛날|old days; long ago
요즘|these days
최근|recently
갑자기|suddenly
드디어|finally
계속|continuously; keep (doing)
특히|especially
보통|usually; ordinary
대부분|most; mostly
전부|all; everything
모두|everyone; all
아무도|nobody (with negative)
아무것도|nothing (with negative)
별로|not really (with negative)
전혀|not at all (with negative)
꼭|surely; be sure to
잠깐|a moment
금방|soon; in a moment
곧|soon
이미|already
아까|a little while ago
방금|just now
`;

export const WORDS = (() => {
  const seen = new Set();
  const out = [];
  for (const line of RAW_WORDS.trim().split('\n')) {
    const [ko, en] = line.split('|');
    if (!ko || seen.has(ko)) continue;
    seen.add(ko);
    out.push({ ko: ko.trim(), en: en.trim() });
  }
  return out;
})();

// [hanja, 훈 음, meaning, examples "word 漢字 meaning; ..."]
const RAW_HANJA = `
日|날 일|day; sun|일요일 日曜日 Sunday; 매일 每日 every day
月|달 월|moon; month|월요일 月曜日 Monday; 매월 每月 every month
火|불 화|fire|화요일 火曜日 Tuesday; 화재 火災 a fire
水|물 수|water|수요일 水曜日 Wednesday; 수영 水泳 swimming
木|나무 목|tree; wood|목요일 木曜日 Thursday; 목재 木材 lumber
金|쇠 금|gold; metal; money|금요일 金曜日 Friday; 현금 現金 cash
土|흙 토|earth; soil|토요일 土曜日 Saturday; 토지 土地 land
人|사람 인|person|한국인 韓國人 Korean person; 인구 人口 population
大|큰 대|big|대학 大學 university; 대통령 大統領 president
小|작을 소|small|소설 小說 novel; 소아과 小兒科 pediatrics
中|가운데 중|middle|중국 中國 China; 중학교 中學校 middle school
學|배울 학|learn|학생 學生 student; 학교 學校 school
生|날 생|life; birth|생일 生日 birthday; 학생 學生 student
先|먼저 선|first; ahead|선생님 先生님 teacher; 우선 于先 first of all
年|해 년|year|내년 來年 next year; 매년 每年 every year
時|때 시|time; hour|시간 時間 time; 시계 時計 clock
間|사이 간|between; interval|시간 時間 time; 인간 人間 human being
國|나라 국|country|한국 韓國 Korea; 외국 外國 foreign country
韓|한국 한|Korea|한국어 韓國語 Korean; 한식 韓食 Korean food
語|말씀 어|language; words|영어 英語 English; 언어 言語 language
外|바깥 외|outside|외국인 外國人 foreigner; 외출 外出 going out
食|먹을 식|food; eat|식당 食堂 restaurant; 음식 飮食 food
飮|마실 음|drink|음료 飮料 beverage; 음식 飮食 food
家|집 가|house; family; expert|가족 家族 family; 작가 作家 writer
族|겨레 족|clan; family|가족 家族 family; 민족 民族 ethnic group
父|아비 부|father|부모 父母 parents; 부친 父親 father (formal)
母|어미 모|mother|부모 父母 parents; 모국어 母國語 native language
子|아들 자|child; son|자녀 子女 children; 여자 女子 woman
女|여자 녀|woman|여자 女子 woman; 여성 女性 female
男|사내 남|man|남자 男子 man; 남성 男性 male
口|입 구|mouth; opening|입구 入口 entrance; 인구 人口 population
入|들 입|enter|입구 入口 entrance; 입학 入學 school admission
出|날 출|go out; exit|출구 出口 exit; 출발 出發 departure
上|윗 상|up; above|이상 以上 more than; 세상 世上 the world
下|아래 하|down; below|지하철 地下鐵 subway; 이하 以下 less than
東|동녘 동|east|동쪽 東쪽 east side; 동양 東洋 the East
西|서녘 서|west|서쪽 西쪽 west side; 서양 西洋 the West
南|남녘 남|south|남쪽 南쪽 south side; 남한 南韓 South Korea
北|북녘 북|north|북쪽 北쪽 north side; 북한 北韓 North Korea
山|뫼 산|mountain|등산 登山 hiking; 화산 火山 volcano
午|낮 오|noon|오전 午前 a.m.; 오후 午後 p.m.
前|앞 전|front; before|오전 午前 a.m.; 이전 以前 before
後|뒤 후|after; behind|오후 午後 p.m.; 후배 後輩 junior
電|번개 전|electricity|전화 電話 telephone; 전기 電氣 electricity
話|말씀 화|talk|전화 電話 telephone; 대화 對話 conversation
車|수레 차|vehicle|자동차 自動車 car; 자전거 自轉車 bicycle
自|스스로 자|self|자동차 自動車 car; 자유 自由 freedom
動|움직일 동|move|운동 運動 exercise; 동물 動物 animal
運|옮길 운|carry; luck|운동 運動 exercise; 운전 運轉 driving
道|길 도|road; way|도로 道路 road; 수도 水道 water supply
名|이름 명|name|유명 有名 famous; 성명 姓名 full name
有|있을 유|have; exist|유명 有名 famous; 유료 有料 paid (not free)
無|없을 무|not have|무료 無料 free of charge; 무리 無理 unreasonable
料|헤아릴 료|fee; ingredient|무료 無料 free; 요리 料理 cooking
理|다스릴 리|reason; logic|요리 料理 cooking; 이유 理由 reason
心|마음 심|heart; mind|중심 中心 center; 안심 安心 relief
安|편안 안|peace; comfort|안녕 安寧 hello (peace); 불안 不安 anxiety
不|아닐 불|not|불편 不便 inconvenient; 부족 不足 shortage
便|편할 편|convenient|편의점 便宜店 convenience store; 불편 不便 inconvenience
店|가게 점|store|편의점 便宜店 convenience store; 서점 書店 bookstore
書|글 서|writing; book|도서관 圖書館 library; 서점 書店 bookstore
館|집 관|building; hall|도서관 圖書館 library; 대사관 大使館 embassy
校|학교 교|school|학교 學校 school; 교복 校服 school uniform
敎|가르칠 교|teach|교육 敎育 education; 교실 敎室 classroom
室|집 실|room|교실 敎室 classroom; 화장실 化粧室 bathroom
會|모일 회|meet; gather|회사 會社 company; 회의 會議 meeting
社|모일 사|company; society|회사 會社 company; 사회 社會 society
員|인원 원|member|회사원 會社員 office worker; 직원 職員 employee
工|장인 공|work; craft|공장 工場 factory; 공부 工夫 study
場|마당 장|place; field|시장 市場 market; 운동장 運動場 playground
市|저자 시|market; city|시장 市場 market; 시민 市民 citizen
民|백성 민|people|국민 國民 citizens of a nation; 시민 市民 citizen
空|빌 공|empty; sky|공항 空港 airport; 공기 空氣 air
氣|기운 기|energy; air|기분 氣分 mood; 인기 人氣 popularity
分|나눌 분|divide; minute|기분 氣分 mood; 부분 部分 part
百|일백 백|hundred|백화점 百貨店 department store; 백만 百萬 one million
千|일천 천|thousand|천 원 千 원 1,000 won; 천만 千萬 ten million
萬|일만 만|ten thousand|만 원 萬 원 10,000 won; 만일 萬一 if by chance
正|바를 정|right; correct|정답 正答 correct answer; 정직 正直 honesty
問|물을 문|ask|질문 質問 question; 문제 問題 problem
題|제목 제|topic; title|문제 問題 problem; 숙제 宿題 homework
答|대답 답|answer|대답 對答 answer; 정답 正答 correct answer
新|새 신|new|신문 新聞 newspaper; 신년 新年 new year
聞|들을 문|hear|신문 新聞 newspaper; 견문 見聞 knowledge from experience
病|병 병|illness|병원 病院 hospital; 병실 病室 hospital room
院|집 원|institution|병원 病院 hospital; 대학원 大學院 graduate school
醫|의원 의|medicine; doctor|의사 醫師 doctor; 의학 醫學 medical science
藥|약 약|medicine|약국 藥局 pharmacy; 약사 藥師 pharmacist
手|손 수|hand|가수 歌手 singer; 선수 選手 athlete
足|발 족|foot; enough|만족 滿足 satisfaction; 부족 不足 shortage
目|눈 목|eye; item|목적 目的 purpose; 과목 科目 school subject
來|올 래|come|내일 來日 tomorrow; 미래 未來 future
行|다닐 행|go; act|여행 旅行 travel; 은행 銀行 bank
旅|나그네 려|travel|여행 旅行 travel; 여권 旅券 passport
銀|은 은|silver|은행 銀行 bank; 수은 水銀 mercury
物|물건 물|thing|동물 動物 animal; 물건 物件 item
品|물건 품|goods|상품 商品 product; 식품 食品 food products
文|글월 문|writing; culture|문화 文化 culture; 문법 文法 grammar
化|될 화|change; become|문화 文化 culture; 변화 變化 change
法|법 법|law; method|문법 文法 grammar; 방법 方法 method
方|모 방|direction; method|방법 方法 method; 지방 地方 region
地|땅 지|land; earth|지하철 地下鐵 subway; 지도 地圖 map
圖|그림 도|drawing; map|지도 地圖 map; 도서관 圖書館 library
天|하늘 천|sky; heaven|천재 天才 genius; 천국 天國 heaven
海|바다 해|sea|해외 海外 overseas; 해변 海邊 beach
花|꽃 화|flower|화분 花盆 flowerpot; 국화 菊花 chrysanthemum
明|밝을 명|bright; clear|설명 說明 explanation; 분명 分明 clearly
白|흰 백|white|백색 白色 white; 고백 告白 confession
愛|사랑 애|love|애인 愛人 sweetheart; 연애 戀愛 dating
好|좋을 호|like; good|호감 好感 good impression; 선호 選好 preference
友|벗 우|friend|우정 友情 friendship; 우호 友好 friendly relations
親|친할 친|close; parent|친구 親舊 friend; 친절 親切 kindness
週|주일 주|week|주말 週末 weekend; 매주 每週 every week
末|끝 말|end|주말 週末 weekend; 연말 年末 end of the year
每|매양 매|every|매일 每日 every day; 매주 每週 every week
今|이제 금|now|지금 只今 now; 금년 今年 this year
高|높을 고|high|고등학교 高等學校 high school; 고급 高級 high-end
最|가장 최|most|최고 最高 the best; 최근 最近 recently
近|가까울 근|near|최근 最近 recently; 근처 近處 nearby
長|길 장|long; chief|사장 社長 company president; 장점 長點 strength
短|짧을 단|short|단점 短點 weakness; 단기 短期 short term
色|빛 색|color|색깔 色깔 color; 갈색 褐色 brown
歌|노래 가|song|가수 歌手 singer; 가사 歌詞 lyrics
音|소리 음|sound|음악 音樂 music; 발음 發音 pronunciation
樂|즐길 락|music; joy|음악 音樂 music; 오락 娛樂 entertainment
發|필 발|emit; start|출발 出發 departure; 발음 發音 pronunciation
意|뜻 의|meaning; intention|의미 意味 meaning; 주의 注意 caution
見|볼 견|see|의견 意見 opinion; 발견 發見 discovery
事|일 사|work; affair|식사 食事 meal; 사고 事故 accident
業|업 업|work; business|수업 授業 class; 직업 職業 job
用|쓸 용|use|사용 使用 use; 비용 費用 cost
`;

export const HANJA = RAW_HANJA.trim().split('\n').map((line) => {
  const [h, hun, en, ex] = line.split('|');
  const examples = ex.split(';').map((s) => s.trim());
  return { h, hun, en, ex: examples };
});
