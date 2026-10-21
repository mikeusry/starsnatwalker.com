# Stars National Walker — Dated History

Moved out of `CLAUDE.md` on 2026-10-21. Standing rules stay in `CLAUDE.md`; this file
is the changelog. Counts below are as of their date, not current.

## Oct 2 2026

### EIS Class of 2028 nominations — `scripts/gamechanger/`

GameChanger season CSVs → combined stats → per-player approval PDF for Joe →
submitted on myeis360.com/nominate. **Start at `scripts/gamechanger/README.md`**:
where every input lives (CSV exports, GC screenshots, action photos, parent
contacts, tournament names, GC team IDs), the workflow, the combining formulas,
and what was still open. The PDF lists parent phones/emails, so it stays on the
Desktop (`~/Desktop/EIS Nominations 2028/`), never in git. This is marketing to
EIS, **not** site data — `import.mjs` only touches `players.json` with `--write`.

Tournament names: GameChanger has none. The team's per-tournament schedule
graphics on X are the source (`x-media.mjs`); two of four date-matched guesses
from public calendars turned out wrong, so don't guess.

## Aug 2 2026

### SEO overhaul — the homepage was outranking the players

Live DataForSEO check across all 15 `<name> softball` queries found only **3 of 15 girls
had their OWN page ranking** (Ayn #1, Kendall #3, Riley #9). Six more ranked but Google
served the **homepage** (Kelsey #4, Charlotte #7, Kierra #7, Lyla #8, Baylee #9,
Austyn #17); six ranked nowhere. Homepage-instead-of-deep-page is the signature of
authority pooling at the root.

Cause: every internal link was slashless and 308-redirected. Fixed sitewide (see the SEO
rules in `CLAUDE.md`), sitemap 19 → 35 URLs, plus a full athlete entity — `Person` with
height, `alumniOf`, `award[]`, NCAA ID and measurables; `BreadcrumbList` routing each
player up through her position hub; `FAQPage` with a **visible** FAQ section (schema alone
is a thin-content risk); and teammate cross-links, since player pages had been dead ends.

Seven thin bios rewritten from verified public reporting. Page word counts ~251 → 420-690.

**Not yet proven:** the fix is mechanically sound and verified live, but no ranking
movement has been measured. Baseline is saved in memory for a clean before/after —
re-run the SERP check before claiming any win.

## Jul 27 2026

### AFCS 2026 — 16U Tier III National Runner-Up

Alliance Fastpitch Championship Series, Jul 19-26, Grand Park (Westfield IN).
Beat Power Surge National, EC Bullets, and LS Bombers in Bracket A; lost the
championship series to EC Bullets Gold Ellis/Keeling.

Surfaced on: Hero badge, `team.json` achievements, Schedule featured card
(6-photo gallery), every player page (17 at the time), and the `/events/...` page.
The conventions it set live in `CLAUDE.md` under "Schedule & OG conventions".

All player photos uploaded to Cloudinary; all verified 200.

## Feb 15 2026

### Player Updates
- Added Kierra Wunderlich (pitcher, RHP/Utility, 2028, Hortonville HS WI)
- Updated bios: Isabel Findlay (power hitter, 5'10"), Cara Orlando (skiing), Keira Frazier (track champion), Ayn Parker Usry (track), Kendall LaManche (#1 NE), Riley Walker (#14 SE), Kelsey Fliss (#15 SE)
- Added Mux videos: Isabel hitting, Cara skiing, Keira track (3 videos), Ayn track (2 videos)
- Added Cloudinary photos to About sections (EIS rankings, track)

### Site Features
- Position pages: `/pitchers`, `/catchers`, `/infielders`, `/outfielders`
- Recruiting hub: `/recruiting` with coach inquiry form
- Admin dashboard: `/admin/dashboard`
- Per-player OG images via satori
- Header polish: button divider, padding, font size
- All mailto: links replaced with web form
