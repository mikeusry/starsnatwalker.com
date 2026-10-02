// Build the EIS nomination approval packet (PDF) for the head coach.
// See README.md in this folder for the full workflow.
//
//   node scripts/gamechanger/import.mjs        (refreshes out/eis-stats-*.json)
//   node scripts/gamechanger/eis-packet.mjs
//
// Nominees = players.json athletes in CLASS not already on the EIS nomination
// tracker (myeis360.com/nomination-status). Screenshots come from GameChanger,
// named <first>-<last>-<season>-<kind>.png in SHOT_DIR; action photos are
// <first>-<last>-action.jpg in ACTION_DIR. The PDF lists parent phones/emails,
// so it is written to the Desktop, never into the repo.

import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, resolve, join } from 'path';
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const CLASS = 2028;
const CLASS_DIR = join(__dirname, `eis-${CLASS}`);
const SHOT_DIR = join(CLASS_DIR, 'gc-screenshots');
const ACTION_DIR = join(CLASS_DIR, 'action-photos');
const OUT_DIR = join(homedir(), 'Desktop', `EIS Nominations ${CLASS}`);
const PDF = join(OUT_DIR, `EIS Class of ${CLASS} Nominations - for Joe.pdf`);
const HTML = join(OUT_DIR, 'packet.html');

const DEADLINE = 'Monday, Oct 5, 2026 at 11:59 PM Mountain (1:59 AM Tue Eastern)';
const SITE = 'https://starsnatwalker.com';
const coach = JSON.parse(readFileSync(join(CLASS_DIR, 'coach.json'), 'utf8'));
// Already nominated per the EIS tracker as of 2026-10-02 (Maddie Diaz, Sara Utrera).
const ALREADY_NOMINATED = new Set([
  'f283f6e0-53bd-4f94-b2f8-a333f16c556a',
  '33d464c0-6130-4819-80d3-e0c47d5e8fb6',
]);

// Slapper answer when it differs from the bats-right default; a lefty not listed
// here is flagged for the coach.
const SLAPPER = {
  '48fec156-a722-47d2-9cdb-b182de64836a': 'N <span class="note">(can slap; predominantly a hitter)</span>', // Sophia Perez
};

// GameChanger schedules for the EIS stats window (Sep 1 2025 – Sep 1 2026).
// GC records only dates/venues. Fall 2025 names are from the team's game-schedule
// graphics (posted on players' X accounts) and match GC opponents.
const TOURNAMENTS = [
  { season: 'Fall 2025', dates: 'Oct 11–12, 2025', venue: 'Tyger River Park, Spartanburg, SC', record: '1-2', name: 'PGF $25,000 Grand Fall Cash-ionals' },
  { season: 'Fall 2025', dates: 'Oct 18–19, 2025', venue: 'Walnut Creek Softball Complex, Raleigh, NC', record: '5-0', name: 'Carolina\'s Premier "Super 60" Team Camp (PGF)' },
  { season: 'Fall 2025', dates: 'Oct 24–26, 2025', venue: 'Champions Park / Easton Sports Complex, Newberry, FL', record: '2-4-1', name: 'Connect Sports Ray Seymour Invitational' },
  { season: 'Fall 2025', dates: 'Nov 1–2, 2025', venue: 'Diamonds at Iron Bridge, Richmond, VA', record: '6-0', name: 'ACFL Fall Championship (Alliance) — undefeated, Alliance Nationals bid' },
  { season: 'Fall 2025', dates: 'Nov 7–9, 2025', venue: 'Lost Mountain Park, Powder Springs, GA', record: '6-0-1', name: 'Veterans Tribute Showcase' },
  { season: 'Fall 2025', dates: 'Nov 21–23, 2025', venue: 'Eddie C. Moore Sports Complex, Clearwater, FL', record: '4-1', name: 'Triple Crown Florida Fall Showcase (Ultimate Qualifier Championship)' },
  { season: 'Summer 2026', dates: 'Jun 5–7, 2026', venue: 'Champions Park, Newberry, FL', record: '4-3', name: 'Show Me The Money' },
  { season: 'Summer 2026', dates: 'Jun 12–14, 2026', venue: 'Heritage Point Park, Dalton, GA', record: '3-2-2', name: 'PGF Super Grand' },
  { season: 'Summer 2026', dates: 'Jun 18–21, 2026', venue: 'Camp Jordan, East Ridge, TN', record: '3-4-1', name: 'Connect Sports Summer Scenic City' },
  { season: 'Summer 2026', dates: 'Jul 1–4, 2026', venue: 'Salisbury / Kennedy / Highline, Denver, CO', record: '2-5', name: 'Colorado 4th of July Sparkler' },
  { season: 'Summer 2026', dates: 'Jul 9–12, 2026', venue: 'Harrison Park / LakePoint, GA', record: '6-1', name: 'Atlanta Legacy Invitational' },
  { season: 'Summer 2026', dates: 'Jul 20–26, 2026', venue: 'Grand Park, Westfield, IN', record: '8-4', name: 'Alliance Fastpitch Championship Series (AFCS) — 16U Tier III National Runner-Up' },
];

const players = JSON.parse(readFileSync(resolve(ROOT, 'src/data/players.json'), 'utf8'));
const team = JSON.parse(readFileSync(resolve(ROOT, 'src/data/team.json'), 'utf8'));
const stats = JSON.parse(readFileSync(resolve(__dirname, 'out/eis-stats-fall2025-summer2026.json'), 'utf8'));
const statsById = new Map(stats.filter((s) => s.rosterId).map((s) => [s.rosterId, s]));
const shots = existsSync(SHOT_DIR) ? readdirSync(SHOT_DIR).filter((f) => f.endsWith('.png')) : [];
const actionPhotos = existsSync(ACTION_DIR) ? readdirSync(ACTION_DIR).filter((f) => /\.(jpe?g|png)$/i.test(f)) : [];
// Gitignored; same contacts the family portal and program-match `families` hold.
const contacts = JSON.parse(readFileSync(resolve(ROOT, 'functions/api/_family-contacts.json'), 'utf8'));
const contactByName = new Map(contacts.map((c) => [c.name.toLowerCase(), c]));

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const slug = (p) => `${p.firstName} ${p.lastName}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
const need = (label) => `<span class="need">NEED: ${esc(label)}</span>`;
const val = (v, missing) => (v == null || v === '' ? need(missing) : esc(v));
const fmtHeight = (inches) => (inches ? `${Math.floor(inches / 12)}'${inches % 12}"` : null);

const joe = team.coaches.find((c) => c.name === 'Joe Walker');
const teamX = (team.socialLinks?.twitter || '').replace(/^https?:\/\/(x|twitter)\.com\//, '@');

const nominees = players
  .filter((p) => p.gradYear === CLASS && !ALREADY_NOMINATED.has(p.id))
  .sort((a, b) => a.lastName.localeCompare(b.lastName));

function statTable(title, rows, seasons) {
  const head = seasons.map((s) => `<th>${esc(s.label)}</th>`).join('');
  const body = rows.map(([label, pick]) => `<tr><td class="lbl">${esc(label)}</td>${seasons.map((s) => `<td class="${s.submit ? 'submit' : ''}">${esc(pick(s.data) ?? '—')}</td>`).join('')}</tr>`).join('');
  return `<h3>${esc(title)}</h3><table class="stats"><thead><tr><th></th>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function playerSection(p) {
  const s = statsById.get(p.id);
  const seasonList = s
    ? [
        ...['2025 Fall', '2026 Summer'].filter((k) => s.seasons[k]).map((k) => ({ label: k, data: s.seasons[k] })),
        ...(s.combined ? [{ label: 'COMBINED (submit this)', data: s.combined, submit: true }] : []),
      ]
    : [];
  if (seasonList.length === 1) seasonList[0] = { ...seasonList[0], label: `${seasonList[0].label} (submit this)`, submit: true };
  const submitData = seasonList.find((x) => x.submit)?.data;

  const hitter = submitData?.c.bat.PA > 0;
  const pitcher = submitData?.c.pit.outs > 0;
  const catcher = submitData?.c.cat.ATT > 0 || /catcher/i.test(p.position);
  const hasVideo = p.videos?.highlightUrl || p.videos?.skillsUrl || p.videos?.muxVideos?.length;
  const profileUrl = `${SITE}/players/${slug(p)}/`;

  const parents = contactByName.get(`${p.firstName} ${p.lastName}`.toLowerCase())?.parents || [];
  const action = actionPhotos.find((f) => f.startsWith(slug(p) + '-'));
  const slapper = SLAPPER[p.id] || (p.bats === 'R' ? 'N <span class="note">(bats right)</span>' : null);

  const gaps = [];
  if (!parents.length) gaps.push('Parent name, phone & email');
  if (!slapper) gaps.push('Slapper? (Y/N)');
  if (!action) gaps.push('Action photo');
  if (!hasVideo) gaps.push('Skills video URL');
  if (catcher && !p.measurables?.popTime) gaps.push('Pop time');

  const tables = [];
  if (hitter) {
    tables.push(statTable('Hitting', [
      ['Batting Average', (d) => d.r.avg], ['On-Base %', (d) => d.r.obp], ['OPS', (d) => d.r.ops],
      ['Plate Appearances', (d) => d.c.bat.PA], ['At Bats', (d) => d.c.bat.AB], ['Hits', (d) => d.c.bat.H],
      ['Doubles', (d) => d.c.bat['2B']], ['Triples', (d) => d.c.bat['3B']], ['Home Runs', (d) => d.c.bat.HR],
      ['RBIs', (d) => d.c.bat.RBI], ['Strikeouts', (d) => d.c.bat.SO], ['Stolen Bases', (d) => d.c.bat.SB],
    ], seasonList));
  }
  if (pitcher) {
    tables.push(statTable('Pitching', [
      ['ERA (7-inning)', (d) => d.r.era], ['WHIP', (d) => d.r.whip], ['Opp. Batting Avg (BAA)', (d) => d.gcBaa],
      ["Strikeouts (K's)", (d) => d.c.pit.SO], ['Walks (BB)', (d) => d.c.pit.BB], ['Innings Pitched', (d) => d.r.ip],
      ['Won / Lost', (d) => `${d.c.pit.W}-${d.c.pit.L}`],
    ], seasonList));
  }
  if (catcher && submitData?.c.cat.ATT > 0) {
    tables.push(statTable('Catching', [
      ['Caught Stealing %', (d) => d.r.csPct], ['Attempts', (d) => d.c.cat.ATT], ['Caught Stealing', (d) => d.c.cat.CS],
      ['Catcher Fielding %*', (d) => d.r.fpct],
    ], seasonList));
  }
  tables.push(statTable('Fielding', [
    ['Fielding %', (d) => d.r.fpct], ['Total Chances', (d) => d.c.fld.TC], ['Assists', (d) => d.c.fld.A], ['Put Outs', (d) => d.c.fld.PO],
  ], seasonList));

  const myShots = shots.filter((f) => f.startsWith(slug(p) + '-')).sort();
  const shotPages = myShots.map((f) => `
    <section class="shot">
      <div class="shot-cap">${esc(p.firstName)} ${esc(p.lastName)} — GameChanger: ${esc(f.replace(slug(p) + '-', '').replace('.png', '').replace(/-/g, ' '))}</div>
      <img src="${pathToFileURL(join(SHOT_DIR, f)).href}">
    </section>`).join('');

  return `
  <section class="player">
    <div class="phead">
      <img class="headshot" src="${esc(p.photoUrl)}">
      <div>
        <h2>${esc(p.firstName)} ${esc(p.lastName)}</h2>
        <div class="sub">Class of ${p.gradYear} · ${esc(p.position)} · ${esc(p.hometown)}, ${esc(p.highSchoolState)}</div>
        <div class="gaps">${gaps.length ? `<b>Joe — fill in:</b> ${gaps.map(esc).join(' · ')}` : '<b>Complete</b> — just review.'}</div>
      </div>
    </div>
    <div class="cols">
      <div>
        <h3>Player Information</h3>
        <table class="kv">
          <tr><td>First / Last name</td><td>${esc(p.firstName)} ${esc(p.lastName)}</td></tr>
          <tr><td>Primary position</td><td>${esc(p.position)}${p.secondaryPositions?.length ? ` (also ${esc(p.secondaryPositions.join(', '))})` : ''}</td></tr>
          <tr><td>Age division</td><td>16U</td></tr>
          <tr><td>Graduation year</td><td>${p.gradYear}</td></tr>
          <tr><td>State of residence</td><td>${val(p.highSchoolState, 'state')}</td></tr>
          <tr><td>Club team</td><td>${esc(team.name)}</td></tr>
          <tr><td>Hometown</td><td>${val(p.hometown, 'hometown')}</td></tr>
          <tr><td>High school</td><td>${val(p.highSchool, 'high school')}</td></tr>
          <tr><td>Bats / Throws</td><td>${esc(p.bats)} / ${esc(p.throws)}</td></tr>
          <tr><td>Height</td><td>${esc(fmtHeight(p.heightInches) || '—')}</td></tr>
          <tr><td>Social handle</td><td>${p.twitter ? '@' + esc(p.twitter) : need('X / Instagram handle')}</td></tr>
          <tr><td>Skills video URL</td><td>${hasVideo ? `${esc(profileUrl)} <span class="note">(video on her profile page — confirm or swap in a direct link)</span>` : need('skills video URL')}</td></tr>
          <tr><td>Headshot</td><td>On file (Cloudinary) <span class="note">— confirm: just her, no hat/glasses/screenshot</span></td></tr>
          <tr><td>Action photo</td><td>${action ? `${esc(action)} <span class="note">— from her X / video, shown on the last page; confirm or swap</span>` : need('action photo')}</td></tr>
          <tr><td>Committed school</td><td>${esc(p.committedTo || 'Uncommitted')}</td></tr>
          <tr><td>Slapper (Y/N)</td><td>${slapper || need('Y/N — bats left')}</td></tr>
          <tr><td>Plays up (Y/N)</td><td>N</td></tr>
          ${catcher ? `<tr><td>Pop time</td><td>${p.measurables?.popTime ? esc(p.measurables.popTime) + ' sec' : need('pop time')}</td></tr>` : ''}
        </table>
        <h3>Parent / Guardian</h3>
        <table class="kv">
          ${parents.length
            ? parents.map((g, i) => `<tr><td>${i === 0 ? 'Primary' : 'Second'}</td><td>${esc(g.name)}<br>${esc(g.phone || '—')} · ${esc(g.email || '—')}</td></tr>`).join('')
            : `<tr><td>Name</td><td>${need('parent first & last')}</td></tr>
          <tr><td>Phone</td><td>${need('parent phone')}</td></tr>
          <tr><td>Email</td><td>${need('parent email')}</td></tr>`}
        </table>
        <h3>Achievements</h3>
        <ul class="ach">${(p.achievements || []).map((a) => `<li>${esc(a)}</li>`).join('')}</ul>
      </div>
      <div>
        ${tables.join('')}
        ${catcher && submitData?.c.cat.ATT > 0 ? '<p class="note">*GameChanger has no catcher-only fielding %; this is her overall fielding %.</p>' : ''}
        <p class="note">Travel ball only, Sep 1 2025 – Sep 1 2026, from GameChanger exports. Combined rates are recomputed from summed counts (not averaged).</p>
      </div>
    </div>
  </section>
  ${shotPages}`;
}

const teamShots = shots.filter((f) => f.startsWith('team-')).sort();

const html = `<!doctype html><html><head><meta charset="utf-8">
<style>
  @page { size: Letter; margin: 0.5in; }
  * { box-sizing: border-box; }
  body { font: 9.5pt/1.3 -apple-system, Helvetica, Arial, sans-serif; color: #111; }
  .player .kv td:first-child { white-space: nowrap; width: 1%; padding-right: 10px; }
  .tourn td, .tourn th { font-size: 8.5pt; padding: 2px 4px; }
  .tourn td:nth-child(2) { white-space: nowrap; }
  h1 { font-size: 22pt; margin: 0 0 4px; color: #0b2545; }
  h2 { font-size: 18pt; margin: 0; color: #0b2545; }
  h3 { font-size: 10.5pt; margin: 12px 0 4px; color: #0b2545; text-transform: uppercase; letter-spacing: .04em; border-bottom: 1px solid #ccd; }
  section { page-break-after: always; }
  .lead { font-size: 11pt; }
  .need { background: #fff3a8; border: 1px solid #e0c200; padding: 0 4px; border-radius: 3px; font-weight: 600; white-space: nowrap; }
  .note { color: #666; font-size: 8.5pt; }
  table { border-collapse: collapse; width: 100%; }
  .kv td { padding: 2px 4px; border-bottom: 1px solid #eee; vertical-align: top; }
  .kv td:first-child { color: #555; width: 38%; }
  .stats th, .stats td { border: 1px solid #dde; padding: 2px 5px; text-align: center; font-size: 9pt; }
  .stats th { background: #0b2545; color: #fff; font-weight: 600; }
  .stats td.lbl { text-align: left; color: #333; }
  .stats td.submit { background: #e6f4ea; font-weight: 700; }
  .summary th, .summary td { border: 1px solid #dde; padding: 4px 6px; text-align: left; }
  .summary th { background: #0b2545; color: #fff; }
  .phead { display: flex; gap: 14px; align-items: center; margin-bottom: 6px; }
  .headshot { width: 90px; height: 90px; border-radius: 50%; object-fit: cover; border: 3px solid #c9a227; }
  .sub { color: #444; margin: 2px 0 6px; }
  .gaps { background: #fffbe0; border-left: 4px solid #e0c200; padding: 4px 8px; font-size: 9pt; }
  .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
  .ach { margin: 0; padding-left: 16px; font-size: 9pt; } .ach li { margin: 0; }
  .player h3 { margin-top: 9px; }
  .player .kv td { padding: 1px 4px; }
  .shot img { width: 100%; max-height: 9.3in; object-fit: contain; object-position: top left; border: 1px solid #ccc; }
  .shot-cap { font-weight: 600; color: #0b2545; margin-bottom: 4px; text-transform: capitalize; }
  ol li { margin: 3px 0; }
  .action-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
  .action-grid figure { margin: 0; text-align: center; }
  .action-grid img { width: 100%; height: 3.6in; object-fit: contain; background: #f4f4f6; border: 1px solid #ccc; }
  .action-grid figcaption { font-weight: 600; color: #0b2545; margin-top: 2px; }
</style></head><body>

<section>
  <h1>EIS Class of 2028 Rankings — Nominations</h1>
  <div class="lead">${esc(team.name)} · Prepared ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} for Coach Joe Walker's approval</div>
  <p><b>Deadline:</b> ${esc(DEADLINE)}. Nominations missing any required field are rejected, and EIS now requires GameChanger screenshots as stat verification (included after each player).</p>

  <h3>Status on the EIS nomination tracker</h3>
  <table class="summary">
    <tr><th>Player</th><th>Position</th><th>Status</th></tr>
    ${players.filter((p) => p.gradYear === CLASS).sort((a, b) => a.lastName.localeCompare(b.lastName)).map((p) => `<tr><td>${esc(p.firstName)} ${esc(p.lastName)}</td><td>${esc(p.position)}</td><td>${ALREADY_NOMINATED.has(p.id) ? 'Already nominated — no action' : '<b>Needs nomination — in this packet</b>'}</td></tr>`).join('')}
  </table>

  <h3>How to approve</h3>
  <ol>
    <li>Check each player's stats and info. Green cells are what gets submitted.</li>
    <li>Fill in every <span class="need">NEED</span> item: each girl's parent contact, tournament names, and the per-player gaps.</li>
    <li>Reply "approved" with the fill-ins. We'll enter all six on myeis360.com/nominate and stop at the final screen for a last look before Submit.</li>
  </ol>
</section>

<section>
  <h1>Team &amp; Contacts</h1>
  <p class="note">Entered once on the EIS form; applies to all six nominations.</p>
  <h3>Team</h3>
  <table class="kv">
    <tr><td>Club team name (as on leaderboard)</td><td>${esc(team.name)} <span class="note">(matches the two existing nominations)</span></td></tr>
    <tr><td>State most team members reside</td><td>NC <span class="note">(confirm — roster spans NC, SC, CO, NY, WI)</span></td></tr>
    <tr><td>Team X handle</td><td>${esc(teamX)}</td></tr>
  </table>
  <h3>Coach</h3>
  <table class="kv">
    <tr><td>Name</td><td>${esc(joe.name)}</td></tr>
    <tr><td>Phone</td><td>${esc(coach.phone)}</td></tr>
    <tr><td>Email</td><td>${esc(coach.email)}</td></tr>
  </table>
  <h3>Nominator</h3>
  <table class="kv">
    <tr><td>Who are you?</td><td>Coach</td></tr>
    <tr><td>Name / Phone / Email</td><td>Same as coach</td></tr>
  </table>

  <h3>Tournaments in the stats window (Sep 1 2025 – Sep 1 2026)</h3>
  <p class="note">EIS: strength of schedule is the most important factor — list every tournament. Records match GameChanger season totals (Fall 24-7-2, Summer 26-19-3).</p>
  <table class="stats tourn">
    <thead><tr><th>Season</th><th>Dates</th><th>Venue (from GameChanger)</th><th>Record</th><th>Tournament name</th></tr></thead>
    <tbody>${TOURNAMENTS.map((t) => `<tr><td>${esc(t.season)}</td><td>${esc(t.dates)}</td><td class="lbl">${esc(t.venue || '—')}</td><td>${esc(t.record)}</td><td class="lbl">${t.name ? esc(t.name) : need('name')}</td></tr>`).join('')}</tbody>
  </table>
</section>

${nominees.map(playerSection).join('')}

${teamShots.map((f) => `
<section class="shot">
  <div class="shot-cap">Team GameChanger: ${esc(f.replace('team-', '').replace('.png', '').replace(/-/g, ' '))}</div>
  <img src="${pathToFileURL(join(SHOT_DIR, f)).href}">
</section>`).join('')}

<section>
  <h1>Action Photos</h1>
  <p class="note">One per athlete for the EIS form. Pulled from each girl's X posts and videos — swap any you don't like.</p>
  <div class="action-grid">
    ${nominees.map((p) => {
      const f = actionPhotos.find((a) => a.startsWith(slug(p) + '-'));
      return `<figure>${f ? `<img src="${pathToFileURL(join(ACTION_DIR, f)).href}">` : need('action photo')}<figcaption>${esc(p.firstName)} ${esc(p.lastName)}</figcaption></figure>`;
    }).join('')}
  </div>
</section>
</body></html>`;

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(HTML, html);
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage();
await page.goto(pathToFileURL(HTML).href, { waitUntil: 'networkidle' });
await page.pdf({ path: PDF, format: 'Letter', printBackground: true, margin: { top: '0.5in', bottom: '0.5in', left: '0.5in', right: '0.5in' } });
await browser.close();
console.log(`Nominees: ${nominees.map((p) => `${p.firstName} ${p.lastName}`).join(', ')}`);
console.log(`PDF: ${PDF}`);
