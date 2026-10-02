// Import GameChanger season-stat CSV exports (Team > Stats > Export stats).
//
//   node scripts/gamechanger/import.mjs           dry run: print + write EIS sheet
//   node scripts/gamechanger/import.mjs --write   also update src/data/players.json
//
// Rate stats are recomputed from counting stats so per-season and combined lines
// use one formula; each recomputed season value is checked against GameChanger's.

import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const PLAYERS = resolve(ROOT, 'src/data/players.json');
const OUT = resolve(__dirname, 'out/eis-stats-fall2025-summer2026.csv');
const OUT_JSON = resolve(__dirname, 'out/eis-stats-fall2025-summer2026.json');

// Newest first: statsSeasons[0] drives the batting FAQ on the player page.
const SEASONS = [
  { label: '2026 Summer', file: 'raw/2026-summer.csv' },
  { label: '2025 Fall', file: 'raw/2025-fall.csv' },
];
const COMBINED_LABEL = '2025 Fall + 2026 Summer';

// GameChanger name -> players.json "first last", where the two disagree.
const NAME_ALIASES = { 'ayn parker': 'ayn parker usry' };

const WRITE = process.argv.includes('--write');

function parseCsv(text) {
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field.replace(/\r$/, '')); rows.push(row); row = []; field = ''; }
    else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const norm = (s) => s.toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, ' ').trim();
const num = (v) => (v === '' || v === '-' || v === 'N/A' ? 0 : Number(v));
const ipToOuts = (ip) => { const [w, f = '0'] = String(ip).split('.'); return Number(w) * 3 + Number(f); };
const outsToIp = (outs) => `${Math.floor(outs / 3)}.${outs % 3}`;
const rate3 = (n, d) => (d ? (n / d).toFixed(3).replace(/^0/, '') : null);
const fixed = (n, d, places) => (d ? (n / d).toFixed(places) : null);

function readSeason({ label, file }) {
  const rows = parseCsv(readFileSync(resolve(__dirname, file), 'utf8').replace(/^\uFEFF/, ''));
  const [sectionRow, headerRow] = rows;
  const keys = [];
  let section = '';
  const seen = new Set();
  headerRow.forEach((h, i) => {
    if (sectionRow[i]) section = sectionRow[i].toLowerCase();
    let key = section ? `${section}.${h}` : h;
    while (seen.has(key)) key += '_dup';
    seen.add(key);
    keys.push(key);
  });

  const players = [];
  for (const r of rows.slice(2)) {
    if (r[0] === 'Totals' || r[0] === '' || r[0] === 'Glossary') break;
    const rec = Object.fromEntries(keys.map((k, i) => [k, r[i] ?? '']));
    const gradYear = Number((rec.Last.match(/\((\d{4})\)/) || [])[1]) || null;
    const last = rec.Last.replace(/\(\d{4}\)/, '').trim();
    const name = [rec.First, last].filter(Boolean).join(' ');
    if (!name) continue;
    players.push({ season: label, name, gradYear, number: rec.Number, rec });
  }
  return players;
}

function counts(rec) {
  const b = (k) => num(rec[`batting.${k}`]);
  const p = (k) => num(rec[`pitching.${k}`]);
  const f = (k) => num(rec[`fielding.${k}`]);
  const [sbAgainst, sbAtt] = (rec['fielding.SB-ATT'] || '0-0').split('-').map(Number);
  return {
    bat: {
      GP: b('GP'), PA: b('PA'), AB: b('AB'), H: b('H'), '1B': b('1B'), '2B': b('2B'), '3B': b('3B'),
      HR: b('HR'), RBI: b('RBI'), R: b('R'), BB: b('BB'), SO: b('SO'), HBP: b('HBP'), SAC: b('SAC'),
      SF: b('SF'), SB: b('SB'), CS: b('CS'),
    },
    pit: {
      GP: p('GP'), GS: p('GS'), outs: ipToOuts(rec['pitching.IP'] || '0'), BF: p('BF'), W: p('W'), L: p('L'),
      SV: p('SV'), H: p('H'), R: p('R'), ER: p('ER'), BB: p('BB'), SO: p('SO'), HBP: p('HBP'),
    },
    fld: { TC: f('TC'), PO: f('PO'), A: f('A'), E: f('E'), DP: f('DP') },
    cat: { outs: ipToOuts(rec['fielding.INN'] || '0'), SB: sbAgainst, ATT: sbAtt, CS: f('CS'), PB: f('PB') },
  };
}

function addCounts(a, b) {
  const out = {};
  for (const grp of Object.keys(a)) {
    out[grp] = {};
    for (const k of Object.keys(a[grp])) out[grp][k] = a[grp][k] + b[grp][k];
  }
  return out;
}

function rates(c) {
  const { bat, pit, fld, cat } = c;
  const tb = bat['1B'] + 2 * bat['2B'] + 3 * bat['3B'] + 4 * bat.HR;
  const obpN = bat.H + bat.BB + bat.HBP;
  const obpD = bat.AB + bat.BB + bat.HBP + bat.SF;
  const obp = obpD ? obpN / obpD : null;
  const slg = bat.AB ? tb / bat.AB : null;
  return {
    avg: rate3(bat.H, bat.AB),
    obp: rate3(obpN, obpD),
    slg: rate3(tb, bat.AB),
    ops: obp != null && slg != null ? (obp + slg).toFixed(3).replace(/^0/, '') : null,
    era: fixed(pit.ER * 7 * 3, pit.outs, 2),
    whip: fixed((pit.H + pit.BB) * 3, pit.outs, 2),
    ip: outsToIp(pit.outs),
    fpct: rate3(fld.PO + fld.A, fld.TC),
    csPct: cat.ATT ? `${Math.round((100 * cat.CS) / cat.ATT)}%` : null,
  };
}

// Recomputed rates must agree with GameChanger's to the precision it displays.
function checkAgainstGc(p, r) {
  const gc = p.rec;
  // [label, ours, GameChanger's, tolerance]; ERA/WHIP are 3 decimals in GC, 2 here.
  const pairs = [
    ['AVG', r.avg, gc['batting.AVG'], 0.0015],
    ['OBP', r.obp, gc['batting.OBP'], 0.0015],
    ['SLG', r.slg, gc['batting.SLG'], 0.0015],
    ['OPS', r.ops, gc['batting.OPS'], 0.0015],
    ['ERA', r.era, gc['pitching.ERA'], 0.0051],
    ['WHIP', r.whip, gc['pitching.WHIP'], 0.0051],
    ['FPCT', r.fpct, gc['fielding.FPCT'], 0.0015],
  ];
  const issues = [];
  for (const [label, mine, theirs, tol] of pairs) {
    if (mine == null || theirs === '' || theirs === '-' || num(theirs) === 0) continue;
    if (Math.abs(Number(mine) - Number(theirs)) > tol) issues.push(`${label} ours ${mine} vs GC ${theirs}`);
  }
  return issues;
}

// Shape a season for players.json statsSeasons (keys rendered by players/[slug].astro).
function toStatsSeason(label, c, r) {
  const s = { season: label };
  const hitter = c.bat.PA > 0;
  const pitcher = c.pit.outs > 0;
  s.games = Math.max(c.bat.GP, c.pit.GP);
  if (hitter) {
    Object.assign(s, {
      avg: r.avg, obp: r.obp, slg: r.slg, ops: r.ops,
      pa: c.bat.PA, ab: c.bat.AB, hits: c.bat.H, doubles: c.bat['2B'], triples: c.bat['3B'],
      hr: c.bat.HR, runs: c.bat.R, rbi: c.bat.RBI, stolenBases: c.bat.SB,
    });
  }
  if (c.fld.TC > 0) s.fieldingPct = r.fpct;
  if (pitcher) {
    Object.assign(s, {
      era: r.era, whip: r.whip, inningsPitched: r.ip,
      wins: c.pit.W, losses: c.pit.L, strikeouts: c.pit.SO,
    });
  }
  return hitter || pitcher ? s : null;
}

// ---------------------------------------------------------------------------

const players = JSON.parse(readFileSync(PLAYERS, 'utf8'));
const rosterByName = new Map(players.map((p) => [norm(`${p.firstName} ${p.lastName}`), p]));
const findRosterPlayer = (gcName) => {
  const key = norm(gcName);
  return rosterByName.get(NAME_ALIASES[key] || key) || null;
};

const bySeason = SEASONS.map((s) => ({ ...s, players: readSeason(s) }));

// Group every GC row under one person (roster id when matched, else GC name).
const people = new Map();
for (const season of bySeason) {
  for (const gp of season.players) {
    const roster = findRosterPlayer(gp.name);
    const key = roster ? roster.id : `gc:${norm(gp.name)}`;
    if (!people.has(key)) {
      people.set(key, {
        roster,
        name: roster ? `${roster.firstName} ${roster.lastName}` : gp.name,
        gradYear: roster?.gradYear ?? gp.gradYear,
        gcGradYears: new Set(),
        seasons: {},
      });
    }
    const person = people.get(key);
    if (gp.gradYear) person.gcGradYears.add(gp.gradYear);
    const c = counts(gp.rec);
    const r = rates(c);
    const issues = checkAgainstGc(gp, r);
    if (issues.length) console.warn(`! ${gp.name} ${season.label}: ${issues.join('; ')}`);
    // BAA needs at-bats against, which the export doesn't carry; keep GC's figure.
    person.seasons[season.label] = { c, r, gcBaa: gp.rec['pitching.BAA'] || null };
  }
}

const warnings = [];
for (const p of people.values()) {
  for (const y of p.gcGradYears) {
    if (p.roster && y !== p.roster.gradYear) {
      warnings.push(`${p.name}: GameChanger lists class of ${y}, players.json says ${p.roster.gradYear}`);
    }
  }
}

// --- EIS sheet: one row per player per season, plus a combined row ---------
const COLS = [
  'Player', 'Class', 'On Roster', 'Season',
  'G', 'PA', 'AB', 'H', '2B', '3B', 'HR', 'RBI', 'R', 'BB', 'SO', 'HBP', 'SF', 'SB', 'CS',
  'AVG', 'OBP', 'SLG', 'OPS',
  'P G', 'P GS', 'IP', 'W', 'L', 'SV', 'P H', 'P R', 'ER', 'P BB', 'P SO', 'ERA', 'WHIP',
  'TC', 'PO', 'A', 'E', 'FPCT',
  'C INN', 'SB Att', 'C CS', 'CS%',
];
const sheetRow = (p, label, { c, r }) => [
  p.name, p.gradYear ?? '', p.roster ? 'Y' : 'N', label,
  c.bat.GP, c.bat.PA, c.bat.AB, c.bat.H, c.bat['2B'], c.bat['3B'], c.bat.HR, c.bat.RBI, c.bat.R,
  c.bat.BB, c.bat.SO, c.bat.HBP, c.bat.SF, c.bat.SB, c.bat.CS,
  r.avg ?? '', r.obp ?? '', r.slg ?? '', r.ops ?? '',
  c.pit.GP, c.pit.GS, c.pit.outs ? r.ip : '', c.pit.W, c.pit.L, c.pit.SV, c.pit.H, c.pit.R, c.pit.ER,
  c.pit.BB, c.pit.SO, r.era ?? '', r.whip ?? '',
  c.fld.TC, c.fld.PO, c.fld.A, c.fld.E, r.fpct ?? '',
  c.cat.outs ? outsToIp(c.cat.outs) : '', c.cat.ATT, c.cat.CS, r.csPct ?? '',
];

const sorted = [...people.values()].sort(
  (a, b) => (a.gradYear ?? 9999) - (b.gradYear ?? 9999) || a.name.localeCompare(b.name),
);
const lines = [COLS];
for (const p of sorted) {
  const present = [...SEASONS].reverse().filter((s) => p.seasons[s.label]);
  for (const s of present) lines.push(sheetRow(p, s.label, p.seasons[s.label]));
  if (present.length > 1) {
    const c = present.map((s) => p.seasons[s.label].c).reduce(addCounts);
    p.combined = { c, r: rates(c) };
    lines.push(sheetRow(p, COMBINED_LABEL, p.combined));
  }
}
const csv = lines.map((l) => l.map((v) => (/[",]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : v)).join(',')).join('\n') + '\n';
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, csv);
writeFileSync(OUT_JSON, JSON.stringify(sorted.map((p) => ({
  rosterId: p.roster?.id ?? null,
  name: p.name,
  gradYear: p.gradYear,
  seasons: p.seasons,
  combined: p.combined ?? null,
})), null, 2) + '\n');

// --- Console summary -------------------------------------------------------
for (const p of sorted) {
  const tag = p.roster ? '' : '  (not on roster)';
  console.log(`\n${p.name} — ${p.gradYear ?? '?'}${tag}`);
  const show = (label, { c, r }) => {
    const bits = [];
    if (c.bat.PA) bits.push(`${r.avg}/${r.obp}/${r.slg} OPS ${r.ops}, ${c.bat.H} H, ${c.bat.HR} HR, ${c.bat.RBI} RBI, ${c.bat.SB} SB in ${c.bat.PA} PA`);
    if (c.pit.outs) bits.push(`${r.ip} IP, ${c.pit.W}-${c.pit.L}, ${r.era} ERA, ${c.pit.SO} K, ${r.whip} WHIP`);
    if (c.cat.ATT) bits.push(`C: ${c.cat.CS}/${c.cat.ATT} CS (${r.csPct})`);
    console.log(`  ${label.padEnd(24)} ${bits.join(' | ') || '(no PA / IP)'}`);
  };
  for (const s of [...SEASONS].reverse()) if (p.seasons[s.label]) show(s.label, p.seasons[s.label]);
  if (p.combined) show(COMBINED_LABEL, p.combined);
}
if (warnings.length) console.log(`\nWarnings:\n  ${warnings.join('\n  ')}`);
console.log(`\nEIS sheet: ${OUT}`);

// --- players.json ----------------------------------------------------------
if (WRITE) {
  const labels = new Set(SEASONS.map((s) => s.label));
  for (const player of players) {
    const person = people.get(player.id);
    if (!person) continue;
    const fresh = SEASONS.map((s) => person.seasons[s.label] && toStatsSeason(s.label, person.seasons[s.label].c, person.seasons[s.label].r)).filter(Boolean);
    if (!fresh.length) continue;
    const kept = (player.statsSeasons && player.statsSeasons.length > 0)
      ? player.statsSeasons.filter((s) => !labels.has(s.season))
      : (player.stats && Object.keys(player.stats).length > 0 ? [player.stats] : []);
    player.statsSeasons = [...fresh, ...kept];
  }
  writeFileSync(PLAYERS, JSON.stringify(players, null, 2) + '\n');
  console.log(`Updated ${PLAYERS}`);
}
