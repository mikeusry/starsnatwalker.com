# Stars National Walker Website

## Quick Reference

| Item | Value |
|------|-------|
| Stack | Astro static, Cloudflare Pages, Supabase, SendGrid, Mux |
| Deploy | `npx wrangler pages deploy dist --project-name starsnatwalker --commit-dirty=true` |
| Build | `npm run build` |
| Dev | `npm run dev` (port 4321) |
| Cloudinary | Cloud: `southland-organics`, Folder: `StarsNationalWalker` |
| Admin | `/admin/` — user: `StarsNatWalker`, pass: `JoeClooney` |

## Deploy

NOT connected to GitHub auto-deploy. Must deploy manually:

```bash
npm run build && npx wrangler pages deploy dist --project-name starsnatwalker --commit-dirty=true
```

### Cloudflare Pages Env Vars (Production)

| Var | Purpose |
|-----|---------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Supabase service role key (for server-side writes) |
| `SENDGRID_API_KEY` | SendGrid API key for transactional email |

## Architecture

### Data

- **Player data**: `src/data/players.json` — all player info, photos, videos, achievements
- **Team data**: `src/data/team.json` — coaches, contact info, social links
- **Schedule**: `src/data/schedule.json` — tournament schedule

### Player Data Structure

Key fields in `players.json`:
- `photoUrl` — Twitter profile photo (DO NOT replace with Cloudinary)
- `photos` — array of `{url, caption}` supplementary photos (shown in About section)
- `videos.muxVideos` — array of `{playbackId, title, description}` for Mux-hosted video
- `achievements` — array of strings
- `bio` — narrative text for coaches

### Contact Flow

All contacts route to `/recruiting#inquiry` web form. **No email addresses shown anywhere.**
- Form submits to `/api/coach-inquiry` (Cloudflare Function)
- Logs to Supabase `coach_inquiries` table
- Sends email via SendGrid to: `mikeusry@gmail.com` AND `mike@southlandorganics.com`

### OG Images

Per-player OG images (1200x630) generated at build time via satori:
- Source: `src/pages/players/og/[slug].png.ts`
- Output: `/players/og/[slug].png`
- Shows: player photo (circular, gold border), name, position, height, class year, team logo
- Fetches Twitter profile photos at build time, converts via sharp

### Admin Dashboard

- `/admin/` — login gate (sessionStorage auth)
- `/admin/dashboard` — profile view analytics from Supabase `profile_views` table
- Filters out: localhost referrers, Sharpsburg (owner's city)
- Highlights: `.edu` referrers (green), college towns (purple)

### Cloudinary

- Cloud name: `southland-organics`
- All player photos in `StarsNationalWalker/` folder
- Use Admin API to list/discover photos (credentials in southland-platform `apps/astro-content/.env`)
- Twitter CDN blocks Cloudinary fetch — cannot use `image/fetch` for Twitter photo URLs

## SEO — three rules that bite here

**1. Every internal link needs a trailing slash.** Cloudflare Pages 308s the slashless
form. `astro.config.mjs` sets `trailingSlash: 'always'`; keep new links slashed —
including the **`href:` values in the nav data arrays** in `Header.astro`/`Footer.astro`
(a regex over literal `href="..."` misses those) and the `ItemList` schema URLs on the
position hubs, which declare the canonical player URL to Google. Verify against the
BUILT output, not the source:

```bash
find dist -name '*.html' -print0 | xargs -0 command grep -hoE 'href="/[a-zA-Z][^"]*"' \
 | command grep -vE 'href="/[^"?#]*/([?#][^"]*)?"'   # should return only /admin/* (noindex)
```

**2. Cloudflare Pages NEVER deletes assets that leave the build.** A removed page keeps
serving 200 from earlier deployments — verified on a *fresh* deployment URL, not just the
cached domain. Deleting a page is not enough; add a `public/_redirects` entry. This is how
`src/pages/README.md` sat live as a public, indexable page of internal dev docs.

**3. `sitemap.xml.ts` is hand-maintained and drifts.** It had lost `/recruiting`, `/camps`
and all four position hubs. Add new routes there when you add pages; the slug helpers for
events/staff are duplicated from their templates (the originals live inside
`getStaticPaths` and aren't importable), so a slug rule change needs both edited.

### GSC

`sc-domain:starsnatwalker.com` — service account
`southland-warehouse@appspot.gserviceaccount.com` has full access (key in
`~/CODING/mothership/southland-warehouse-service-account.json`). Property created
2026-08-02, so **there is no history before that date** — an empty result means "no data
yet," not "no traffic."

## TODO

### Next Session
- [ ] **Re-run the per-player SERP check ~Aug 16-30** and diff vs the baseline in memory
      (`project_seo_baseline_2026-08.md`). Pre-fix: only 3/15 girls ranked their OWN page.
- [ ] **8 missing GPAs** — Fliss, Frazier, Jones, LaManche, Llaneza, Orlando, Wunderlich,
      Kinch. Not public data; needs Mike. Each adds a schema field AND an FAQ entry.
- [ ] Kendall LaManche + Charlotte Llaneza have **zero public press coverage** despite
      Kendall being #1 NE pitcher — a PR gap, not an SEO one.
- [ ] Test coach inquiry form (submit test, verify Supabase + SendGrid)
- [ ] Add tracking pixel to player pages so dashboard has data
- [ ] Get email addresses for all players and set up forwarding
- [x] ~~Upload all player photos to Cloudinary~~ — done; all 17 verified 200 (Jul 27 2026)

**When adding a player: write a real bio in the same commit.** A bio of scouting
adjectives ("excellent range and a reliable bat") is worth almost nothing — the girls who
rank are the girls with facts on the page. Search her name + high school first; local
sports desks (highschoolot.com, si.com state pages, regional papers) cover these kids far
more than you'd expect. **Never invent a stat**, and when rewriting an existing bio,
**diff against the original before committing** — a rewrite silently dropped a pitcher's
16 IP / 35 K / 0.00 ERA line, a 4x sectional ski title, and two national rankings on
2026-08-02, all caught only by diffing.

**When adding a player: migrate her photo to Cloudinary in the same commit.**
A raw `pbs.twimg.com` URL works the day you add it and 404s weeks later when
she changes her avatar. The build does not fail (OG falls back to text), so
nothing alerts you. Check with `command grep -rn "twimg\.com" src/` — plain
`grep -r` is aliased to ugrep here and skips gitignored files.

## Recent Work (Aug 2 2026)

### SEO overhaul — the homepage was outranking the players

Live DataForSEO check across all 15 `<name> softball` queries found only **3 of 15 girls
had their OWN page ranking** (Ayn #1, Kendall #3, Riley #9). Six more ranked but Google
served the **homepage** (Kelsey #4, Charlotte #7, Kierra #7, Lyla #8, Baylee #9,
Austyn #17); six ranked nowhere. Homepage-instead-of-deep-page is the signature of
authority pooling at the root.

Cause: every internal link was slashless and 308-redirected. Fixed sitewide (see the SEO
rules above), sitemap 19 → 35 URLs, plus a full athlete entity — `Person` with height,
`alumniOf`, `award[]`, NCAA ID and measurables; `BreadcrumbList` routing each player up
through her position hub; `FAQPage` with a **visible** FAQ section (schema alone is a
thin-content risk); and teammate cross-links, since player pages had been dead ends.

Seven thin bios rewritten from verified public reporting. Page word counts ~251 → 420-690.

**Not yet proven:** the fix is mechanically sound and verified live, but no ranking
movement has been measured. Baseline is saved in memory for a clean before/after —
re-run the SERP check before claiming any win.

## Recent Work (Jul 27 2026)

### AFCS 2026 — 16U Tier III National Runner-Up

Alliance Fastpitch Championship Series, Jul 19-26, Grand Park (Westfield IN).
Beat Power Surge National, EC Bullets, and LS Bombers in Bracket A; lost the
championship series to EC Bullets Gold Ellis/Keeling.

Surfaced on: Hero badge, `team.json` achievements, Schedule featured card
(6-photo gallery), all 17 player pages, and the `/events/...` page.

**Two conventions this set:**

- **An event with a `result` renders as a result, not a preview.** Setting
  `result` on a `schedule.json` event flips `/events/[slug]` to a result hero
  with a "Road to the Championship" block, and drops it from "Upcoming
  Events". Keep the event in BOTH `events` and `pastEvents` — `/events/[slug]`
  generates its page from `events`, so removing it 404s the page.
- **`team.achievements[0]` drives the OG share card** (`src/pages/og.png.ts`
  renders it as a gold banner). Best current credential goes first.

## Recent Work (Feb 15 2026)

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
