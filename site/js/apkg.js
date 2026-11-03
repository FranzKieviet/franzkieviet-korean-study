// Builds an Anki package (.apkg) in the browser, so cards can be imported without AnkiConnect, e.g. on a phone:
// AnkiMobile and AnkiDroid open .apkg files directly. The package carries its own deck and note types.
// Format: a zip holding "collection.anki2" (a SQLite database in Anki's legacy schema 11) and "media" ({}).
// SQLite comes from sql.js, loaded from cdnjs the first time it's needed.

const SQL_JS = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/';
let sqlPromise;

/** Load sql.js (≈650 kB, cached by the browser). Call early to make the first export instant. */
export function loadSql() {
  sqlPromise ||= new Promise((resolve, reject) => {
    if (globalThis.initSqlJs) return resolve();
    const s = document.createElement('script');
    s.src = `${SQL_JS}sql-wasm.js`;
    s.onload = resolve;
    s.onerror = () => reject(new Error('Could not load the Anki file builder. Are you online?'));
    document.head.append(s);
  }).then(() => globalThis.initSqlJs({ locateFile: (f) => SQL_JS + f }))
    .catch((e) => { sqlPromise = null; throw e; });
  return sqlPromise;
}

const SCHEMA = `
CREATE TABLE col (id integer primary key, crt integer not null, mod integer not null, scm integer not null, ver integer not null, dty integer not null, usn integer not null, ls integer not null, conf text not null, models text not null, decks text not null, dconf text not null, tags text not null);
CREATE TABLE notes (id integer primary key, guid text not null, mid integer not null, mod integer not null, usn integer not null, tags text not null, flds text not null, sfld integer not null, csum integer not null, flags integer not null, data text not null);
CREATE TABLE cards (id integer primary key, nid integer not null, did integer not null, ord integer not null, mod integer not null, usn integer not null, type integer not null, queue integer not null, due integer not null, ivl integer not null, factor integer not null, reps integer not null, lapses integer not null, left integer not null, odue integer not null, odid integer not null, flags integer not null, data text not null);
CREATE TABLE revlog (id integer primary key, cid integer not null, usn integer not null, ivl integer not null, factor integer not null, lastIvl integer not null, type integer not null, ease integer not null, time integer not null);
CREATE TABLE graves (usn integer not null, oid integer not null, type integer not null);
CREATE INDEX ix_notes_usn on notes (usn);
CREATE INDEX ix_cards_usn on cards (usn);
CREATE INDEX ix_revlog_usn on revlog (usn);
CREATE INDEX ix_cards_nid on cards (nid);
CREATE INDEX ix_cards_sched on cards (did, queue, due);
CREATE INDEX ix_revlog_cid on revlog (cid);
CREATE INDEX ix_notes_csum on notes (csum);`;

const DCONF = {
  1: {
    id: 1, name: 'Default', mod: 0, usn: 0, maxTaken: 60, autoplay: true, timer: 0, replayq: true,
    new: { bury: true, delays: [1, 10], initialFactor: 2500, ints: [1, 4, 7], order: 1, perDay: 20, separate: true },
    rev: { bury: true, ease4: 1.3, fuzz: 0.05, ivlFct: 1, maxIvl: 36500, minSpace: 1, perDay: 200 },
    lapse: { delays: [10], leechAction: 0, leechFails: 8, minInt: 1, mult: 0 },
  },
};
const CONF = {
  activeDecks: [1], curDeck: 1, newSpread: 0, collapseTime: 1200, timeLim: 0, estTimes: true, dueCounts: true,
  curModel: null, nextPos: 1, sortType: 'noteFld', sortBackwards: false, addToCur: true,
};

const deckJson = (id, name, mod) => ({
  id, name, mod, usn: -1, desc: '', dyn: 0, conf: 1, collapsed: false, extendNew: 0, extendRev: 50,
  newToday: [0, 0], revToday: [0, 0], lrnToday: [0, 0], timeToday: [0, 0],
});

/** Fields a template's front needs, so Anki knows when a card exists. */
function req(fields, front, ord) {
  const used = [...front.matchAll(/{{[#^/]?(?:[^}:]*:)*([^}]+)}}/g)].map((m) => fields.indexOf(m[1].trim())).filter((i) => i >= 0);
  return [ord, 'all', [...new Set(used)]];
}

const modelJson = (m, did, mod) => ({
  id: m.id, name: m.name, type: 0, mod, usn: -1, sortf: 0, did, css: m.css, tags: [], vers: [],
  latexPre: '\\documentclass[12pt]{article}\n\\special{papersize=3in,5in}\n\\usepackage[utf8]{inputenc}\n\\usepackage{amssymb,amsmath}\n\\pagestyle{empty}\n\\setlength{\\parindent}{0in}\n\\begin{document}\n',
  latexPost: '\\end{document}',
  flds: m.fields.map((name, ord) => ({ name, ord, font: 'Arial', size: 20, media: [], rtl: false, sticky: false })),
  tmpls: m.templates.map((t, ord) => ({ name: t.Name, ord, qfmt: t.Front, afmt: t.Back, bqfmt: '', bafmt: '', did: null })),
  req: m.templates.map((t, ord) => req(m.fields, t.Front, ord)),
});

async function sha1Hex(s) {
  const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

const stripHtml = (s) => s.replace(/<[^>]*>/g, '').trim();

/** Stable 52-bit id from a string, so the same deck name / note always gets the same id. */
const idFrom = async (s) => parseInt((await sha1Hex(s)).slice(0, 13), 16);

/**
 * deck: deck name ("A::B" for subdecks)
 * notes: [{ model: { id, name, fields, templates, css }, fields: [...strings], tags: [...] }]
 * Same model ids → Anki reuses the note type on later imports. Note guids come from the model and first field,
 * so importing a word that's already there updates it instead of adding a duplicate.
 * Returns the package as a Uint8Array.
 */
export async function buildApkg(deck, notes, SQL) {
  SQL ||= await loadSql();
  const db = new SQL.Database();
  try {
    db.run(SCHEMA);
    const now = Date.now();
    const sec = Math.floor(now / 1000);
    const did = await idFrom(`deck:${deck}`);
    const models = Object.fromEntries([...new Map(notes.map((n) => [n.model.id, n.model])).values()].map((m) => [m.id, modelJson(m, did, sec)]));
    const decks = { 1: deckJson(1, 'Default', 0), [did]: deckJson(did, deck, sec) };
    db.run('INSERT INTO col VALUES (1, ?, ?, ?, 11, 0, 0, 0, ?, ?, ?, ?, ?)',
      [sec, now, now, JSON.stringify(CONF), JSON.stringify(models), JSON.stringify(decks), JSON.stringify(DCONF), '{}']);

    let cid = now;
    for (const [i, n] of notes.entries()) {
      const nid = now + i;
      const sort = stripHtml(n.fields[0]);
      const guid = (await sha1Hex(`korean-study:${n.model.id}:${sort}`)).slice(0, 16);
      const csum = parseInt((await sha1Hex(sort)).slice(0, 8), 16);
      const tags = n.tags.length ? ` ${n.tags.join(' ')} ` : '';
      db.run('INSERT INTO notes VALUES (?, ?, ?, ?, -1, ?, ?, ?, ?, 0, \'\')',
        [nid, guid, n.model.id, sec, tags, n.fields.join('\x1f'), sort, csum]);
      for (const ord of n.model.templates.keys()) {
        db.run('INSERT INTO cards VALUES (?, ?, ?, ?, ?, -1, 0, 0, ?, 0, 0, 0, 0, 0, 0, 0, 0, \'\')', [cid++, nid, did, ord, sec, i + 1]);
      }
    }
    return zip([
      { name: 'collection.anki2', data: db.export() },
      { name: 'media', data: new TextEncoder().encode('{}') },
    ]);
  } finally {
    db.close();
  }
}

// --- A minimal zip writer (stored, no compression) ---

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(data) {
  let c = 0xffffffff;
  for (const b of data) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function zip(files) {
  const enc = new TextEncoder();
  const parts = [];
  const central = [];
  let offset = 0;
  for (const f of files) {
    const name = enc.encode(f.name);
    const crc = crc32(f.data);
    const header = (sig, extra) => {
      const b = new DataView(new ArrayBuffer(extra ? 46 : 30));
      let p = 0;
      const u32 = (v) => { b.setUint32(p, v, true); p += 4; };
      const u16 = (v) => { b.setUint16(p, v, true); p += 2; };
      u32(sig);
      if (extra) u16(20); // version made by
      u16(20); u16(0x0800); u16(0); u16(0); u16(0x21); // version needed, flags (UTF-8 names), stored, time, date (1980-01-01)
      u32(crc); u32(f.data.length); u32(f.data.length);
      u16(name.length); u16(0);
      if (extra) { u16(0); u16(0); u16(0); u32(0); u32(offset); } // comment, disk, attrs, local header offset
      return new Uint8Array(b.buffer);
    };
    const local = header(0x04034b50, false);
    parts.push(local, name, f.data);
    central.push(header(0x02014b50, true), name);
    offset += local.length + name.length + f.data.length;
  }
  const size = central.reduce((s, c) => s + c.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, files.length, true);
  end.setUint16(10, files.length, true);
  end.setUint32(12, size, true);
  end.setUint32(16, offset, true);
  const all = [...parts, ...central, new Uint8Array(end.buffer)];
  const out = new Uint8Array(all.reduce((s, a) => s + a.length, 0));
  let p = 0;
  for (const a of all) { out.set(a, p); p += a.length; }
  return out;
}
