# Stars National Walker — Site Manifesto

> The single source of truth for what this site IS, who it serves, and what belongs on it.
> Anything that contradicts this document is a bug. Use this to judge every page, link, and piece of copy.
>
> **Status:** DRAFT — pending Mike's red-line. Items marked `[CONFIRM]` need Mike's input before finalizing.
> **Last updated:** 2026-05-03

---

## 1. What this site is, in one sentence

**A recruiting showcase for the Stars National Walker travel softball roster** — built so college coaches can find, evaluate, and contact our players, and so families can run their recruiting process without getting lost.

Everything else (camp prep, family portal, admin tooling) exists in service of that mission.

## 2. What this site is NOT

Naming what's out of scope is how we kill scope creep. We are NOT:

- A general softball blog or resource
- A Southland Organics page (separate org, separate domain)
- A tournament results aggregator
- A team-history archive
- A recruiting CRM (that's `program-match`, the sister repo)
- A souvenir / merch storefront
- A page for any team other than Stars National Walker (the specific roster — not the broader Stars National organization)

If a page or feature pulls toward any of those, it gets cut or moved.

## 3. Audiences, in priority order

The order matters. When two audiences would design a page differently, audience #1 wins.

| # | Audience | What they need | How we serve them |
|---|----------|----------------|-------------------|
| 1 | **College coaches** evaluating our players | Fast access to a player's video, measurables, GPA, schedule, contact path | Per-player pages, position pages, schedule, recruiting hub, OG images for shareable links |
| 2 | **Stars families** (current roster) | Camp prep, recruiting workflow, link into program-match, schedule, shared resources | `/family/` portal (gated), `/family/recruiting` doctrine, family-bridge to program-match |
| 3 | **Prospective families** considering Stars | What the program is, what makes it different, how to try out | `/`, `/tryout`, `/recruiting` (philosophy), `/contact` |
| 4 | **Mike (admin)** | Dashboards, traffic data, internal docs | `/admin/*` — gated, noindex |

**Public-but-low-priority:** Casual fans, parents of opponents, etc. They can read the public pages but no surface area is designed for them.

## 4. Canonical surface area

Every page that should exist, grouped by audience. **Anything not on this list is either deleted, redirected, or added with justification.**

### Public — Coaches & Recruits (Audience 1)

| Path | Purpose | Notes |
|------|---------|-------|
| `/` | Roster showcase + value prop | Hero, feature roster, schedule, about |
| `/players/[slug]` | Per-player profile (video, bio, measurables, contact) | Static, OG image generated |
| `/pitchers` | All pitchers — stat-rich filter view | Position page |
| `/catchers` | All catchers | Position page |
| `/infielders` | All infielders | Position page |
| `/outfielders` | All outfielders | Position page |
| `/recruiting` | Recruiting hub: philosophy, schedule, coach inquiry form | Public-facing — what we believe, how we work |
| `/coaches` | Coaches landing page (for college coaches arriving cold) | Different from `/staff/*` — this is a sales/intro page |
| `/staff/[slug]` | Bio page for each Stars coach/coordinator | Public, links from About section |
| `/contact` | Web form (no mailto:) | Submits to `/api/coach-inquiry` |

### Public — Prospective Families (Audience 3)

| Path | Purpose | Notes |
|------|---------|-------|
| `/tryout` | How to join Stars | |
| `/brand` | Brand assets (rare, but useful for tournaments/media) | `[CONFIRM]` keep or delete? |
| `/events/[slug]` | Tournament event detail pages | `[CONFIRM]` is this populated? Used? |

### Gated — Stars Families (Audience 2)

All `/family/*` pages: `noindex`, gated by family password (sessionStorage).

| Path | Purpose | Notes |
|------|---------|-------|
| `/family/login` | Family password gate | |
| `/family/` | Family hub: camp card, recruiting hub bridge, homework form, next tournament | |
| `/family/recruiting` | Stars recruiting philosophy / "doctrine" | Anchors what we believe — derived from webinar takeaways |

### Gated — Admin (Audience 4)

All `/admin/*` pages: `noindex`, sessionStorage gate.

| Path | Purpose | Notes |
|------|---------|-------|
| `/admin/` | Login | |
| `/admin/dashboard` | Profile-view analytics | |
| `/admin/teams` | Tournament team rosters / availability | |
| `/admin/pitchers` | Pitcher-hunt board (EIS data) | |
| `/admin/help/` | Internal docs index | |
| `/admin/help/*` | Camp prep docs, webinar takeaways | |

### API endpoints (Cloudflare Functions)

| Path | Purpose |
|------|---------|
| `/api/coach-inquiry` | Public coach inquiry form → Supabase + SendGrid email Mike |
| `/api/family-homework` | Family homework form → Supabase + SendGrid email Mike |
| `/api/family-bridge` | Family → program-match magic-link bridge |
| `/api/inbound-email` | SendGrid Inbound Parse webhook for outreach replies |

### Routes that should exist but don't (TODO)

- `/coordinator` — `[CONFIRM]` should this redirect to `/staff/mike-usry`, or be its own page?

---

## 5. Sources of truth (data discipline)

A page that hardcodes data duplicating one of these is a bug.

| Domain | Source of truth | Owner |
|--------|-----------------|-------|
| Player roster, bios, photos, video, achievements | `src/data/players.json` | This repo |
| Schedule (tournaments, dates, locations) | `src/data/schedule.json` | This repo |
| Coaches, coordinator, contact, social, achievements | `src/data/team.json` | This repo |
| Family portal copy (camp card, homework prompts) | `src/data/family-content.json` | This repo |
| Pitcher targets (EIS scrape) | `src/data/eis-pitchers.json` | This repo |
| Recruiting CRM — coach contacts, outreach threads, replies | `program-match` Supabase | Sister repo |
| Profile-view analytics | Supabase `profile_views` | This repo writes, dashboard reads |
| Coach inquiries | Supabase `coach_inquiries` | This repo |
| Family homework submissions | Supabase `family_homework` | This repo (table TBD) |

**Rules:**
1. **Never fabricate facts.** No invented bios, no stand-in photos of celebrities, no fake testimonials, no placeholder phone numbers like `(704) 555-STAR`.
2. **No mailto: links anywhere.** All contact routes through web forms (`/contact`, `/family/`). Email addresses are not displayed publicly.
3. **No celebrity / wikipedia / archive.gov photo URLs.** Every photo URL must be Cloudinary, the player's own social/profile photo, or a real photo we own.
4. **No `info@`-style mailboxes** unless the mailbox actually exists and forwards somewhere.
5. **Cross-repo data flows one direction.** This repo is the source for player data. `program-match` is the source for outreach/CRM data. They meet at the family-bridge.

---

## 6. Identity & voice

### What we are
- **An "elite" team in the recruiting-pipeline sense** — every player is on a track to play in college. Not "elite" as fluff.
- **Honest with coaches.** If we vouch for a player, it lands. We don't oversell.
- **A club that owns recruiting work** — we drive the bus alongside the player, not behind them.
- **Travel softball, headquartered in Charlotte, NC** — players come from around the country.

### Voice
- Direct, plain, confident. No hype words ("amazing," "world-class," "elite" used loosely).
- Coach-first phrasing: "Here's the player, here's the video, here's the schedule" — not "join our journey."
- No emojis in body copy unless the user explicitly wants them.

### What "elite" means here
- Players who are on real D1/D2/NAIA recruiting boards (Isabel Findlay's 20 D1 targets, EIS rankings on multiple players)
- Real measurables (Blast Motion bat speed, exit velo, mph, GPA) — not vibes
- Real tournament schedule (PGF, Alliance, Power Pool)

If a copy block can't back up "elite" with evidence on the page, the word comes out.

## 7. Link discipline

1. **Every internal link points to a page on the canonical surface area.** If the link target isn't in §4, the link is broken — fix the link or add the page.
2. **No mailto: links anywhere on public pages.** Replace with web form.
3. **External links must have a reason.** Twitter/X profile from header is fine. Random LinkedIn, Wikipedia, archive.gov links are bugs.
4. **Tracked outreach links** (from coach emails) should land on `/players/[slug]?coach=...&school=...&utm_*` and the `Layout.astro` attribution capture handles the rest.
5. **Sister-repo links** (`program-match.vercel.app/recruiting`) only via the `family-bridge` flow — never raw, since the magic-link auth is the bridge.

## 8. Privacy & gating

- **Public pages = noindex on player pages? `[CONFIRM]`** Players are minors. Decide whether `/players/[slug]` should be `noindex` to avoid casual indexing of kids' profiles, while still being shareable for coaches.
- **`/family/*` is `noindex` and password-gated.** Already enforced.
- **`/admin/*` is `noindex` and password-gated.** Already enforced.
- **No phone numbers or home addresses on public pages.**
- **Player emails are NOT shown.** They live in Supabase and only flow through `family-bridge`.

## 9. False-data rules (the audit's main weapon)

Any of the following is a bug, no debate:

| Pattern | Example we have today | Verdict |
|---------|----------------------|---------|
| Stand-in celebrity photo | George Clooney as "Joe Walker" | DELETE — replace or remove |
| Fabricated bio | "Mike was a Georgia Bulldogs quarterback" | REWRITE with true bio |
| Placeholder phone | `(704) 555-STAR` | DELETE or replace with real |
| Stale season label | `"season": "2025-2026"`, `"division": "16U"` | UPDATE to current |
| Lorem ipsum / "elite athletes" with no proof | Generic feature blurbs | REWRITE specific or DELETE |
| Unverified achievements | Real claims must stay; unverified ones come out | VERIFY or DELETE — "Alliance Atlantic Region Champions Fall 2025" is verified true |
| Email addresses that don't actually receive mail | `info@starsnatwalker.com` | DELETE — route to web form |
| Dead route in nav | `/coordinator` | FIX or REDIRECT |
| Wikipedia/archive.gov photo URLs | Adrian Diaz photo on whitehouse.gov | REPLACE with real photo or none |

## 10. Single-page checklist (used by the audit)

For every page on the canonical list, the audit will answer:

1. **Audience served?** Maps to one of #1–4 from §3.
2. **On the canonical surface area?** Yes or "delete it."
3. **Data sources correct?** Pulls from §5, no hardcoded duplicates.
4. **No false data?** Per §9.
5. **All internal links resolve to canonical pages?**
6. **No mailto:? No phone? No celebrity photos?**
7. **Voice/tone matches §6?**
8. **Privacy/gating correct per §8?**

A "no" on any of these is an audit finding with one of three verdicts: **fix**, **redirect**, or **delete**.

---

## Open questions for Mike

### Answered (2026-05-03)

1. **Team age & season.** ✅ **First-year 16U.** `team.json` `"season": "2025-2026"` and `"division": "16U"` to be verified against this. First-year framing is truthful and the Fall 2025 Region title is *more* impressive for a first-year team — lean into it, don't hide it.
2. **Coaches are real.** ✅ Joe Walker, Adrian Diaz, Jeremiah Perez are real people. Bios stay; the **celebrity placeholder photos** (Clooney, W. Bush, George Brett, Costanza) must be replaced with real photos. Verify bio accuracy with Mike.
3. **Mike's bio lead.** ✅ Use the D1-athlete background as **credibility with coaches** — he knows recruiting from the inside. Lead with that, pivot fast to what he does for Stars players. Claude drafts, Mike approves.

### Answered (2026-05-03, round 2)

7. **"PGF Southeast Qualifier - Top 8"** ✅ **legit, keep.** Also add **"AFCA Atlantic Champions"** to achievements.
8. **Player profile indexing.** ✅ **INDEXED, aggressive SEO.** Player pages should be everywhere — searchable, shareable, maximally discoverable. NOT noindex. (Privacy mitigations still apply: no home address, no phone, no player email shown on-page — but the pages themselves are public + indexed by design.)
9. **`(704) 555-STAR` phone.** ✅ **Remove entirely.** No public phone.
10. **`info@starsnatwalker.com`.** ✅ **Replace with `mikeusry@gmail.com`** wherever a contact email is genuinely needed in data. (Public pages still route humans through web forms — but the data-layer contact email is `mikeusry@gmail.com`, not the dead `info@` stub.)

### Still open — Claude proceeds with the flagged default unless Mike overrides

4. **`/coordinator` URL.** Default: **redirect → `/staff/mike-usry`** (301 in `public/_redirects`). Override for a standalone page.
5. **`/brand` page.** Default: **keep** (low cost, useful for media/tournaments). Has an `18U` error to fix regardless.
6. **`/events/[slug]`.** Audit determines data source + whether anything links to it. If orphaned with no data → flag for delete.

**Manifesto is effectively final.** Achievements now: Alliance Atlantic Region Champions (Fall 2025), AFCA Atlantic Champions, PGF Southeast Qualifier Top 8 — all verified true. First-year 16U, Charlotte NC. SEO posture: maximize player-page reach.
