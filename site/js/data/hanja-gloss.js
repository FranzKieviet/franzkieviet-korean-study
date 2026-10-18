// Short English glosses for every character in the hanja example words, so each word can be shown as
// "Study + period = Semester" without showing the Chinese characters themselves.

const G = `
日 day|月 month|火 fire|水 water|木 wood|金 gold|土 earth|人 person|大 big|小 small|中 middle|學 study|生 life
先 first|年 year|時 time|間 between|國 country|韓 Korea|語 language|外 outside|食 eat|飮 drink|家 house|族 clan
父 father|母 mother|子 child|女 woman|男 man|口 mouth|入 enter|出 exit|上 above|下 below|東 east|西 west|南 south
北 north|山 mountain|午 noon|前 before|後 after|電 electricity|話 talk|車 vehicle|自 self|動 move|運 carry|道 road
名 name|有 have|無 without|料 fee|理 reason|心 heart|安 peace|不 not|便 convenient|店 store|書 book|館 building
校 school|敎 teach|室 room|會 gather|社 company|員 member|工 work|場 place|市 market|民 people|空 empty|氣 energy
分 part|百 hundred|千 thousand|萬 ten thousand|正 correct|問 ask|題 topic|答 answer|新 new|聞 hear|病 illness
院 institution|醫 medicine|藥 drug|手 hand|足 foot|目 eye|來 come|行 go|旅 travel|銀 silver|物 thing|品 goods
文 writing|化 change|法 law|方 direction|地 land|圖 drawing|天 heaven|海 sea|花 flower|明 bright|白 white|愛 love
好 like|友 friend|親 close|週 week|末 end|每 every|今 now|高 high|最 most|近 near|長 long|短 short|色 color
歌 song|音 sound|樂 joy|發 emit|意 meaning|見 see|事 affair|業 work|用 use
曜 weekday|災 disaster|泳 swim|材 material|現 present|統 rule|領 lead|說 explain|兒 child|科 department|于 at
計 measure|英 England|言 speech|堂 hall|作 make|性 nature|以 from|世 world|鐵 iron|洋 ocean|登 climb|輩 peer
對 facing|轉 turn|由 cause|路 road|姓 surname|寧 calm|宜 suitable|使 envoy|服 clothes|育 raise|粧 makeup
議 discuss|職 job|夫 man|港 port|部 section|貨 goods|一 one|直 straight|質 quality|宿 lodge|師 master|局 office
選 choose|滿 full|的 target|未 not yet|券 ticket|件 item|商 trade|變 change|才 talent|邊 edge|盆 pot
菊 chrysanthemum|告 tell|戀 romance|感 feeling|情 emotion|舊 old|切 earnest|只 just|等 rank|級 level|處 place
點 point|期 period|褐 brown|詞 words|娛 amuse|味 taste|注 pour|故 incident|授 give|費 cost
쪽 side|님 (honorific)|원 won|깔 (color)`;

export const GLOSS = Object.fromEntries(G.trim().split(/[|\n]/).map((s) => {
  const [ch, ...rest] = s.trim().split(' ');
  return [ch, rest.join(' ')];
}));

// Words where a character is used in a less common sense
const OVERRIDES = {
  作家: ['make', 'expert'], 家族: ['family', 'clan'], 現金: ['present', 'money'], 音樂: ['sound', 'music'],
  運轉: ['move', 'turn'], 小說: ['small', 'story'], 社長: ['company', 'chief'], 銀行: ['silver', 'firm'],
  注意: ['pour', 'mind'], 滿足: ['full', 'enough'], 不足: ['not', 'enough'], 料理: ['measure', 'arrange'],
  科目: ['department', 'item'], 于先: ['at', 'first'], 工夫: ['work', 'effort'], 天國: ['heaven', 'land'],
};

/**
 * Break an example word into its parts: 학기/學期 → [{ syl: '학', gloss: 'study' }, { syl: '기', gloss: 'period' }].
 * Spaces (천 원) are skipped; unknown characters get an empty gloss.
 */
export function partsOf(ko, hj) {
  const k = [...ko];
  const c = [...hj];
  const over = OVERRIDES[hj.replace(/[^一-鿿]/g, '')];
  let hanjaIdx = 0;
  const parts = [];
  k.forEach((syl, i) => {
    if (syl === ' ') return;
    const ch = c[i] || syl;
    const isHanja = /[一-鿿]/.test(ch);
    const gloss = (isHanja && over?.[hanjaIdx]) || GLOSS[ch] || '';
    if (isHanja) hanjaIdx++;
    parts.push({ syl, ch, gloss });
  });
  return parts;
}
