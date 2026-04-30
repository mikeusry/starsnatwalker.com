import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '../..');
const RAW = resolve(__dirname, 'output/pitchers-raw.json');
const ALIASES = resolve(__dirname, 'org-aliases.json');
const HANDLES = resolve(__dirname, 'org-handles.json');
const OUT = resolve(ROOT, 'src/data/eis-pitchers.json');
mkdirSync(dirname(OUT), { recursive: true });

const data = JSON.parse(readFileSync(RAW, 'utf8'));
const aliases = JSON.parse(readFileSync(ALIASES, 'utf8'));
const handles = JSON.parse(readFileSync(HANDLES, 'utf8'));

// Auto-normalize a team string into a canonical org key.
// Strategy: strip coach/age/division suffixes, collapse whitespace, lowercase.
// Then look up in alias map; if no alias, fall back to the auto-normalized form (Title Case).
const STRIP_TOKENS = [
  /\b(16u|14u|18u|12u|10u|8u)\b/gi,
  /\b(09|10|2009|2010|2011|2012|2026|2027|2028|2029|2030)\b/g,
  /\b(2k7|2k8|2k9|2k10)\b/gi,
  /\b(26\/27|27\/28|28\/29|29\/30)\b/g,
  /\b(gold|premier|nat'?l|national|elite|select|academy|futures|gulf coast|nst)\b/gi,
  /\b(p)\b/gi, // single P (pitcher division flag)
];

const aliasKeys = Object.keys(aliases)
  .filter((k) => !k.startsWith('_'))
  .sort((a, b) => b.length - a.length);

function lookupAlias(s) {
  if (aliases[s]) return aliases[s];
  // longest-prefix match: "athletics gold tamborra" should match "athletics gold"
  for (const k of aliasKeys) {
    if (s === k || s.startsWith(k + ' ')) return aliases[k];
  }
  return null;
}

function normalizeOrgKey(team) {
  if (!team) return '';
  let s = team
    .toLowerCase()
    .replace(/[''`]/g, "'")
    .replace(/[–—]/g, '-')
    // drop coach-name suffix after dash or slash
    .replace(/\s*-\s*[^-]+$/g, '')
    .replace(/\s*\/\s*[^/]+$/g, '');
  // collapse non-alphanumeric for first lookup
  let firstPass = s
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  // FIRST attempt: alias lookup BEFORE stripping division/age tokens
  // so "athletics gold" (alias) wins before being collapsed to "athletics"
  let hit = lookupAlias(firstPass);
  if (hit) return hit;
  // Otherwise strip age/division tokens and try again
  let stripped = firstPass;
  for (const re of STRIP_TOKENS) stripped = stripped.replace(re, ' ');
  stripped = stripped.replace(/\s+/g, ' ').trim();
  hit = lookupAlias(stripped);
  if (hit) return hit;
  // Fallback: title-case the stripped key
  return stripped
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

const cellText = (v) => (v && typeof v === 'object' && 'text' in v ? v.text : v ?? '');
const cellHref = (v) => (v && typeof v === 'object' && 'href' in v ? v.href : '');

function normalize(year, sectionName, headers, row) {
  const get = (...keys) => {
    for (const k of keys) {
      const i = headers.findIndex((h) => (h || '').toLowerCase().trim() === k);
      if (i !== -1) return row[i];
    }
    return undefined;
  };

  let rank = '';
  for (let i = 0; i < headers.length; i++) {
    if ((headers[i] || '').toLowerCase().includes('rank')) {
      rank = cellText(row[i]);
      break;
    }
  }

  const first = cellText(get('player first', 'first name', 'name'));
  const last = cellText(get('player last', 'last name', 'last'));
  const hometown = cellText(get('hometown', 'player hometown'));
  const coachFirst = cellText(get('coach first', 'coach first name', 'coch first name'));
  const coachLast = cellText(get('coach last', 'coach last name'));
  const coachSingle = cellText(get('coach'));
  const coach = coachSingle || [coachFirst, coachLast].filter(Boolean).join(' ');
  const team = cellText(get('club team name', 'travel team name', 'team'));
  const socialHref = cellHref(get('social'));

  // Section type classification
  const upper = sectionName.toUpperCase();
  let listType = 'national';
  let region = '';
  if (upper.includes('NORTHEAST')) { listType = 'regional'; region = 'Northeast'; }
  else if (upper.includes('SOUTHEAST')) { listType = 'regional'; region = 'Southeast'; }
  else if (upper.includes('MIDWEST')) { listType = 'regional'; region = 'Midwest'; }
  else if (upper.includes('SOUTHWEST')) { listType = 'regional'; region = 'Southwest'; }
  else if (upper.includes('MOUNTAIN')) { listType = 'regional'; region = 'Mountain'; }
  else if (upper.includes('WEST')) { listType = 'regional'; region = 'West'; }
  else if (upper.includes('ELITE')) { listType = 'elite-100'; region = 'National'; }
  else if (upper.includes('SELECT')) { listType = 'select-200'; region = 'National'; }
  else if (upper.includes('PROSPECT')) { listType = 'prospect-300'; region = 'National'; }

  return {
    year,
    rank: parseInt(rank, 10) || null,
    rankRaw: rank,
    first,
    last,
    fullName: [first, last].filter(Boolean).join(' '),
    hometown,
    coach,
    team,
    teamKey: (team || '').toLowerCase().replace(/\s+/g, ' ').trim(),
    org: normalizeOrgKey(team),
    socialHref,
    section: sectionName,
    listType,
    region,
  };
}

const rawRows = [];
const meta = { years: {}, scrapedAt: new Date().toISOString() };

for (const year of Object.keys(data)) {
  const payload = data[year];
  meta.years[year] = { url: payload.url, sections: payload.tables.length, total: 0 };
  for (const s of payload.tables) {
    for (const row of s.rows) {
      const p = normalize(year, s.sectionName, s.headers, row);
      if (p.fullName) rawRows.push(p);
    }
    meta.years[year].total += s.rows.length;
  }
}

// Dedupe in two passes:
// PASS 1: collapse identical (year + name + team) rows (different ranking sections).
// PASS 2: merge by X handle when present — same handle = same person, even across team-name variants.
// PASS 3: merge by (year + name + canonical org) — catches dupes across team-name variants without an X handle.
const TIER_ORDER = { 'elite-100': 1, 'select-200': 2, 'prospect-300': 3, regional: 4, national: 5 };

function playerKeyTeam(p) {
  return `${p.year}|${(p.fullName || '').toLowerCase()}|${p.teamKey || ''}`;
}

// PASS 1
const stage1 = new Map();
for (const r of rawRows) {
  const key = playerKeyTeam(r);
  if (!stage1.has(key)) {
    stage1.set(key, {
      year: r.year,
      first: r.first,
      last: r.last,
      fullName: r.fullName,
      hometown: r.hometown,
      coach: r.coach,
      team: r.team,
      teamKey: r.teamKey,
      org: r.org,
      socialHref: r.socialHref || '',
      rankings: [],
    });
  }
  const p = stage1.get(key);
  if (!p.socialHref && r.socialHref) p.socialHref = r.socialHref;
  if (!p.hometown && r.hometown) p.hometown = r.hometown;
  p.rankings.push({
    listType: r.listType,
    region: r.region,
    rank: r.rank,
    rankRaw: r.rankRaw,
    section: r.section,
  });
}

function mergeIntoCanonical(target, src) {
  for (const rk of src.rankings) target.rankings.push(rk);
  if (!target.socialHref && src.socialHref) target.socialHref = src.socialHref;
  if (!target.hometown && src.hometown) target.hometown = src.hometown;
  if (!target.coach && src.coach) target.coach = src.coach;
  // prefer the longer / more specific team string (more detail = more likely the team they actually play for)
  if (src.team && (!target.team || src.team.length > target.team.length)) {
    target.team = src.team;
    target.teamKey = src.teamKey;
  }
}

// PASS 2: merge stage1 entries by X handle
const byHandle = new Map();
const stage2 = [];
for (const p of stage1.values()) {
  if (p.socialHref) {
    const existing = byHandle.get(p.socialHref);
    if (existing) {
      mergeIntoCanonical(existing, p);
      continue;
    }
    byHandle.set(p.socialHref, p);
  }
  stage2.push(p);
}
// stage2 currently misses the byHandle canonicals (they were never pushed). Push them now.
for (const p of byHandle.values()) {
  if (!stage2.includes(p)) stage2.push(p);
}

// PASS 3: merge by (year + name + org) — catches no-handle dupes across team-string variants
const byNameOrg = new Map();
const players = [];
for (const p of stage2) {
  const key = `${p.year}|${(p.fullName || '').toLowerCase()}|${(p.org || '').toLowerCase()}`;
  const existing = byNameOrg.get(key);
  if (existing) {
    mergeIntoCanonical(existing, p);
    continue;
  }
  byNameOrg.set(key, p);
  players.push(p);
}

// Dedupe rankings within each player (Pass 1+2+3 may have duplicated rankings)
for (const p of players) {
  const seen = new Set();
  p.rankings = p.rankings.filter((rk) => {
    const k = `${rk.listType}|${rk.region}|${rk.rankRaw}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  p.rankings.sort((a, b) => (TIER_ORDER[a.listType] || 99) - (TIER_ORDER[b.listType] || 99) || (a.rank || 999) - (b.rank || 999));
  p.topTier = p.rankings[0]?.listType || 'national';
  p.topRank = p.rankings[0]?.rank || null;
  p.topRegion = p.rankings[0]?.region || '';
}

players.sort((a, b) => {
  if (a.year !== b.year) return a.year < b.year ? -1 : 1;
  const ta = TIER_ORDER[a.topTier] || 99;
  const tb = TIER_ORDER[b.topTier] || 99;
  if (ta !== tb) return ta - tb;
  return (a.topRank || 999) - (b.topRank || 999);
});

// Build aggregate views — count distinct players per CANONICAL ORG (not raw team string)
const orgs = {};
for (const p of players) {
  if (!p.org) continue;
  if (!orgs[p.org]) orgs[p.org] = { org: p.org, count: 0, years: new Set(), teamVariants: new Set() };
  orgs[p.org].count++;
  orgs[p.org].years.add(p.year);
  if (p.team) orgs[p.org].teamVariants.add(p.team);
}

// Tier classification by canonical org count.
// Loose cutoffs — easier to find diamonds in the rough.
// 8+ pitchers across the org = peer (skip)
// 2-7 = strong regional (sweet spot)
// 1 = outlier
function tierFor(count) {
  if (count >= 8) return 'peer';
  if (count >= 2) return 'strong-regional';
  return 'outlier';
}

const orgList = Object.values(orgs)
  .map((o) => {
    const meta = handles[o.org] || {};
    return {
      org: o.org,
      count: o.count,
      years: [...o.years].sort(),
      teamVariants: [...o.teamVariants].sort(),
      tier: tierFor(o.count),
      x: meta.x || '',
      website: meta.website || '',
      atNewberry: meta.atNewberry == null ? null : !!meta.atNewberry,
      notes: meta.notes || '',
    };
  })
  .sort((a, b) => b.count - a.count);

// Also build a per-(raw-team) list for the team filter dropdown — but show the org behind it
const teams = {};
for (const p of players) {
  if (!p.team) continue;
  if (!teams[p.teamKey]) teams[p.teamKey] = { team: p.team, org: p.org, count: 0, years: new Set() };
  teams[p.teamKey].count++;
  teams[p.teamKey].years.add(p.year);
}
const teamList = Object.values(teams)
  .map((t) => ({ team: t.team, org: t.org, count: t.count, years: [...t.years].sort() }))
  .sort((a, b) => b.count - a.count);

// Stamp tier + org-count + Newberry attendance onto each player
const orgMetaMap = {};
for (const o of orgList) orgMetaMap[o.org] = o;
for (const p of players) {
  p.teamTier = orgs[p.org] ? tierFor(orgs[p.org].count) : 'outlier';
  p.orgRankedCount = orgs[p.org]?.count || 0;
  p.teamRankedCount = teams[p.teamKey]?.count || 0;
  p.atNewberry = orgMetaMap[p.org]?.atNewberry ?? null;
  p.orgX = orgMetaMap[p.org]?.x || '';
}

writeFileSync(
  OUT,
  JSON.stringify(
    {
      meta,
      orgs: orgList,
      teams: teamList,
      pitchers: players,
    },
    null,
    2
  )
);
console.log(`Wrote ${OUT}`);
console.log(`  ${rawRows.length} ranking rows → ${players.length} distinct pitchers`);
console.log(`  ${orgList.length} canonical orgs (${orgList.filter((o) => o.tier === 'peer').length} peer, ${orgList.filter((o) => o.tier === 'strong-regional').length} strong-regional, ${orgList.filter((o) => o.tier === 'outlier').length} outlier)`);
console.log(`  ${teamList.length} raw team strings`);
