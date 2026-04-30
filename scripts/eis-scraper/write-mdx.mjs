import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '../..');
const RAW = resolve(__dirname, 'output/pitchers-raw.json');
const OUT_DIR = resolve(ROOT, 'docs/recruiting');
mkdirSync(OUT_DIR, { recursive: true });

const data = JSON.parse(readFileSync(RAW, 'utf8'));

// Column harmonization across years.
// 2027: Rank | First | Last | Hometown | CoachFirst | CoachLast | Team
// 2028: Rank | First | Last | Hometown | CoachFirst | CoachLast | Team
// 2029: Rank | Performance | First | Last | Social | Hometown | Coach | Team
const NORM_HEADERS = ['Rank', 'First', 'Last', 'Hometown', 'Coach', 'Team', 'Social'];

function normalizeRow(headers, row) {
  // headers and row are aligned arrays from the scrape
  const map = {};
  headers.forEach((h, i) => {
    const k = (h || '').toLowerCase();
    map[k] = row[i];
  });
  // accept many header variants
  const get = (...keys) => {
    for (const k of keys) {
      const found = headers.findIndex((h) => (h || '').toLowerCase().trim() === k);
      if (found !== -1) return row[found];
    }
    return undefined;
  };

  const cellText = (v) => (v && typeof v === 'object' && 'text' in v ? v.text : v ?? '');
  const cellHref = (v) => (v && typeof v === 'object' && 'href' in v ? v.href : '');

  // Rank — header may be "ELITE RANKINGS #", "RANKINGS #", "Rankings #", "Ranking #",
  // "NE RANKINGS #", "SE RANKINGS #", "MW RANKINGS #", "SW RANKINGS #", "MTN RANKINGS #",
  // "WEST RANKINGS #", "Region Ranking #", "RANKING".
  let rank = '';
  for (let i = 0; i < headers.length; i++) {
    const h = (headers[i] || '').toLowerCase();
    if (h.includes('rank')) {
      rank = cellText(row[i]);
      break;
    }
  }

  // First / Last
  const first = cellText(get('player first', 'first name', 'name'));
  const last = cellText(get('player last', 'last name', 'last'));

  // Hometown
  const hometown = cellText(get('hometown', 'player hometown'));

  // Coach
  const coachFirst = cellText(get('coach first', 'coach first name', 'coch first name'));
  const coachLast = cellText(get('coach last', 'coach last name'));
  const coachSingle = cellText(get('coach'));
  const coach = coachSingle || [coachFirst, coachLast].filter(Boolean).join(' ');

  // Team
  const team = cellText(get('club team name', 'travel team name', 'team'));

  // Social (links + text)
  const socialCell = get('social');
  const socialHref = cellHref(socialCell);

  return { rank, first, last, hometown, coach, team, socialHref };
}

function mdEscape(s) {
  if (!s) return '';
  return String(s).replace(/\|/g, '\\|');
}

function tableToMd(headers, rows) {
  const lines = [];
  lines.push('| ' + headers.map(mdEscape).join(' | ') + ' |');
  lines.push('|' + headers.map(() => '---').join('|') + '|');
  for (const r of rows) {
    lines.push('| ' + r.map(mdEscape).join(' | ') + ' |');
  }
  return lines.join('\n');
}

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

let totalsByYear = {};

for (const year of Object.keys(data)) {
  const payload = data[year];
  const sections = payload.tables;
  const lines = [];

  let total = 0;
  sections.forEach((s) => (total += s.rows.length));
  totalsByYear[year] = total;

  lines.push(`---`);
  lines.push(`title: "EIS Pitcher Rankings — Class of ${year}"`);
  lines.push(`source: "${payload.url}"`);
  lines.push(`scraped: "${new Date().toISOString().slice(0, 10)}"`);
  lines.push(`totalPitchers: ${total}`);
  lines.push(`---`);
  lines.push('');
  lines.push(`# Class of ${year} — Pitcher Rankings`);
  lines.push('');
  lines.push(`Source: [Extra Inning Softball — Class of ${year} Pitchers](${payload.url})`);
  lines.push('');
  lines.push(`**${total} pitchers** across ${sections.length} ranking lists.`);
  lines.push('');
  lines.push('## Sections');
  lines.push('');
  sections.forEach((s) => {
    lines.push(`- [${s.sectionName}](#${slugify(s.sectionName)}) — ${s.rows.length} pitchers`);
  });
  lines.push('');

  for (const s of sections) {
    lines.push(`## ${s.sectionName}`);
    lines.push('');
    const has2029Social = s.headers.some((h) => (h || '').toLowerCase() === 'social');
    const tableHeaders = ['#', 'First', 'Last', 'Hometown', 'Coach', 'Team'];
    if (has2029Social) tableHeaders.push('Social');
    const tableRows = s.rows.map((r) => {
      const n = normalizeRow(s.headers, r);
      const out = [n.rank, n.first, n.last, n.hometown, n.coach, n.team];
      if (has2029Social) {
        out.push(n.socialHref ? `[X](${n.socialHref})` : '');
      }
      return out;
    });
    lines.push(tableToMd(tableHeaders, tableRows));
    lines.push('');
  }

  const file = resolve(OUT_DIR, `eis-pitchers-${year}.mdx`);
  writeFileSync(file, lines.join('\n'));
  console.log(`Wrote ${file}`);
}

// Master index
const indexLines = [];
indexLines.push(`---`);
indexLines.push(`title: "Recruiting — Pitcher Hunt"`);
indexLines.push(`updated: "${new Date().toISOString().slice(0, 10)}"`);
indexLines.push(`---`);
indexLines.push('');
indexLines.push(`# Recruiting — Pitcher Hunt`);
indexLines.push('');
indexLines.push(`**Need:** Fill-in pitcher for *Show Me The Money* (PGF) — Newberry, FL — Jun 5–8, 2026.`);
indexLines.push('');
indexLines.push(`**Roster gap:** Kendall LaManche (injury) + Kierra Wunderlich (HS playoffs likely conflict). Avery is the only healthy arm.`);
indexLines.push('');
indexLines.push(`**Eligibility:** 2027/28/29. 60+ mph FB.`);
indexLines.push('');
indexLines.push(`## EIS Pitcher Lists (scraped ${new Date().toISOString().slice(0, 10)})`);
indexLines.push('');
for (const year of Object.keys(data)) {
  indexLines.push(`- [Class of ${year}](./eis-pitchers-${year}.mdx) — ${totalsByYear[year]} pitchers`);
}
indexLines.push('');
indexLines.push(`## Notes`);
indexLines.push('');
indexLines.push(`- Source: Extra Inning Softball, member-gated rankings.`);
indexLines.push(`- Each class has Extra Elite 100 (national top 100), Extra Select 101-200, Extra Prospect 201-300, plus regional lists (Northeast / Southeast / Midwest / Southwest / Mountain / West).`);
indexLines.push(`- 2029 lists include X (Twitter) handles in the SOCIAL column.`);
indexLines.push(`- 2027 / 2028 lists do not have public socials — coach name + team is the contact path.`);
indexLines.push(`- EIS rankings do not publish velocity. Being on the list is the proxy for "throws hard enough."`);
indexLines.push(`- Re-run scraper: \`node scripts/eis-scraper/scrape-pitchers.mjs && node scripts/eis-scraper/write-mdx.mjs\``);
indexLines.push('');

const indexFile = resolve(OUT_DIR, 'index.mdx');
writeFileSync(indexFile, indexLines.join('\n'));
console.log(`Wrote ${indexFile}`);
console.log('\nTotals:', totalsByYear);
