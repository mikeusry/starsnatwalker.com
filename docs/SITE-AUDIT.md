# Stars National Walker — Site Audit

> Per-page audit against [SITE-MANIFESTO.md](./SITE-MANIFESTO.md). Every finding has a verdict: **FIX**, **REDIRECT**, **DELETE**, or **VERIFY**.
> Generated 2026-05-03. Decisions from Mike folded in.

---

## Verdict legend

- 🔴 **FIX** — broken/false/garbage; correct it
- 🟡 **VERIFY** — claim may be true; Mike confirms before it stays
- 🔵 **REDIRECT** — route a dead URL to its real home
- ⚫ **DELETE** — leftover with no place on the canonical surface area
- ✅ **OK** — clean, no action

---

## TIER 1 — Critical (false data a college coach will see)

These directly undermine credibility on the recruiting-facing surface. Fix first.

### 1.1 🔴 Celebrity placeholder photos for all 4 staff — `src/data/team.json`
| Line | Person | Current photo | Reality |
|------|--------|---------------|---------|
| 34 | Joe Walker (Head Coach) | Wikipedia — **George Clooney** | placeholder |
| 41 | Adrian Diaz (Outfield Coach) | whitehouse.gov — **George W. Bush** | placeholder |
| 48 | Jeremiah Perez (Asst Coach) | sabr.org — **George Brett** | placeholder |
| 61 | Mike Usry (Recruiting Coord.) | Wikipedia — **George Costanza** | placeholder |

**Verdict:** FIX. People are real; photos are not. Replace with real headshots (Cloudinary, `StarsNationalWalker/` folder). Until real photos exist, render the existing SVG silhouette fallback ([staff/[slug].astro:49-55](src/pages/staff/[slug].astro#L49-L55) already has one) rather than a celebrity. **Blocks nothing technically, but this is the #1 trust-killer on the site.**
**Needs from Mike:** 4 real headshots.

### 1.2 🔴 "18U Gold Fastpitch" — `src/pages/brand.astro:279,287`
Team is **first-year 16U**. Brand guide shows `18U`.
**Verdict:** FIX → `16U`.

### 1.3 🔴 "50+ D1 Scouts Watched Us Play" — `src/pages/tryout.astro:15-18`
> "In Fall 2025 alone, over 50 Division I college scouts were in attendance at our games."

Presented as hard fact, unverified, and risky on a recruiting site (coaches notice inflation).
**Verdict:** VERIFY or FIX. If you can't substantiate "50+", replace with what's true and stronger: **"Alliance Atlantic Region Champions & AFCA Atlantic Champions — Fall 2025."** Real titles beat a soft scout-count.
**Needs from Mike:** is "50+ scouts" defensible? If not, I swap in the championships.

### 1.4 🔴 Fabricated team location "Sharpsburg" — *anywhere it appears*
Manifesto: team is **Charlotte, NC**. Sharpsburg is leftover (it's Mike's Southland city). The content agent didn't surface a live "Sharpsburg" string in pages, but the dashboard filter references it ([admin/dashboard.astro](src/pages/admin/dashboard.astro)) — that's *correct* there (filtering owner's traffic). **Action:** grep one more time at fix-time to be certain no public page prints "Sharpsburg."
**Verdict:** FIX if found on any public page; OK in the dashboard filter.

---

## TIER 2 — Manifesto violations (contact & data discipline)

### 2.1 🔴 mailto: links across the site (manifesto bans them)
| File | Line | Target |
|------|------|--------|
| [components/Contact.astro](src/components/Contact.astro) | 27 | `team.headCoach.email` |
| components/Contact.astro | 44 | `team.coaches[1].email` |
| components/Contact.astro | 61 | `team.coaches[2].email` |
| components/Contact.astro | 78 | `team.recruitingCoordinator.email` |
| [staff/[slug].astro](src/pages/staff/[slug].astro) | 65 | `staff.email` |
| staff/[slug].astro | 95 | `staff.email` (CTA button) |
| [recruit/[slug].astro](src/pages/recruit/[slug].astro) | 121 | hardcoded `mike@starsnatwalker.com` |
| [family/recruiting.astro](src/pages/family/recruiting.astro) | 164 | `mike@southlandorganics.com` |
| [family/index.astro](src/pages/family/index.astro) | 179 | `mike@southlandorganics.com` |
| [family/login.astro](src/pages/family/login.astro) | 30 | `mike@southlandorganics.com` |

**Verdict:** FIX. Public pages (Contact, staff, recruit) → replace mailto: with a link to the web form (`/recruiting#inquiry` or `/contact`). Family pages are gated/noindex — lower priority, but for consistency point them at the family flow or `mikeusry@gmail.com`. **Decision needed:** keep zero emails public, or is `mikeusry@gmail.com` OK to expose on the gated family pages? (Manifesto default: forms only.)

### 2.2 🔴 Placeholder phone "(704) 555-STAR" — `src/data/team.json:74`
**Verdict:** FIX → remove the `contactPhone` field entirely (Mike: "remove it"). Then grep for any page that printed it.

### 2.3 🔴 Stub email "info@starsnatwalker.com" — `src/data/team.json:73`
**Verdict:** FIX → replace with `mikeusry@gmail.com` (Mike's call). Note this is the data-layer value; public pages still route humans to forms.

### 2.4 🟡 Family portal uses `mike@southlandorganics.com`
Three family pages hardcode the Southland Organics address. Cross-brand leakage.
**Verdict:** FIX → `mikeusry@gmail.com` for consistency (matches 2.3), unless the SendGrid-from in [functions/api/family-homework.ts:18](functions/api/family-homework.ts#L18) needs the southland sender for deliverability — that's a *sender* concern, separate from a *displayed* address. Displayed = `mikeusry@gmail.com`.

---

## TIER 3 — Stale labels & first-year framing

### 3.1 🔴 Season label "2025-2026" — `src/data/team.json:5`
First-year team; the range label implies history.
**Verdict:** FIX → "2026" or "Summer 2026". Decide one label, use everywhere.

### 3.2 🔴 "Now Recruiting for 2025-2026 Season" — `src/pages/tryout.astro:76`
Same stale label.
**Verdict:** FIX → match 3.1.

### 3.3 🟡 Generic hype without proof — `src/pages/tryout.astro:11,21,84`
> "one of the top travel softball programs in the country" (×2), "top-tier national tournaments"

For a first-year team, unbacked superlatives read as inflation.
**Verdict:** FIX → anchor every claim to the real evidence: Region Champions + AFCA Atlantic Champions + PGF SE Qualifier Top 8. "First-year team that won its region" is a *stronger, truer* story than "top program in the country."

### 3.4 🟢 Add new achievement — `src/data/team.json:69-72`
**Verdict:** FIX (additive). Add **"AFCA Atlantic Champions"** alongside the existing Alliance Atlantic Region title. Confirmed achievements list:
1. Alliance Atlantic Region Champions — Fall 2025 ✅
2. AFCA Atlantic Champions ✅ (new)
3. PGF Southeast Qualifier — Top 8 ✅

---

## TIER 4 — Routing & surface-area cleanup

### 4.1 🔵 `/coordinator` — dead URL
No route exists; `coordinator` is only a `type` tag in [staff/[slug].astro:15](src/pages/staff/[slug].astro#L15). The actual page is `/staff/mike-usry`.
**Verdict:** REDIRECT → add `/coordinator /staff/mike-usry 301` to `public/_redirects` (file doesn't exist yet — create it).

### 4.2 🟡 `/recruit/[slug]` vs `/players/[slug]` — two player-page systems
`/recruit/[slug]` (created May 15, "private per-coach recruit video pages") is separate from the public `/players/[slug]`. It hardcodes `mike@starsnatwalker.com` (2.1) and wasn't in the original surface-area list.
**Verdict:** VERIFY intent. Is `/recruit/[slug]` meant to be private (per-coach, unindexed, token-gated) while `/players/[slug]` is the public SEO page? If so, document the split in the manifesto and ensure `/recruit/*` is `noindex`. If it's leftover/superseded → DELETE.
**Needs from Mike:** keep `/recruit/[slug]` as the private coach-share variant, or fold into `/players/[slug]`?

### 4.3 🟡 `/events/[slug]` — possibly orphaned
Dynamic route exists; audit found no internal links pointing to it and no obvious data source.
**Verdict:** VERIFY. If nothing links to it and there's no event data → DELETE. If it's the future tournament-detail system → keep + wire to `schedule.json`.

### 4.4 🟡 `/brand` page — keep but has the 18U bug
**Verdict:** KEEP (manifesto default) + FIX 1.2. Also uses a `via.placeholder.com` demo image at line 251 — acceptable for a brand-doc page, but worth a real logo lockup eventually.

---

## TIER 5 — Data-binding bugs (dynamic data ignored)

### 5.1 🔴 All players hardcoded "Uncommitted" — `src/pages/coaches.astro:174`
The page prints a literal `Uncommitted` for every player, ignoring the real `recruitingStatus` / `committedTo` fields that **already exist** in players.json (all 15 currently `"uncommitted"`, but the binding is wrong regardless).
**Verdict:** FIX → bind to `player.recruitingStatus` / `player.committedTo`. Today it's coincidentally accurate (everyone's uncommitted); the day someone commits, this silently lies.

### 5.2 🟡 Player photo sourcing — `src/data/players.json`
Mix of `pbs.twimg.com` (Twitter CDN) and Cloudinary. CLAUDE.md notes Twitter CDN is fragile (blocks Cloudinary fetch; can rot). Not false data, but a durability risk for the SEO-critical player pages.
**Verdict:** VERIFY / migrate. Per CLAUDE.md TODO: upload all player photos to Cloudinary, stop depending on Twitter CDN. Lower urgency than Tier 1-3 but matters for the "players everywhere" SEO goal — broken hero images tank a profile page.

---

## TIER 6 — Verify-only (truth unknown to Claude)

| # | Item | Location | Question for Mike |
|---|------|----------|-------------------|
| 6.1 | Coach bios specifics | team.json:35,42,49 | Joe "founded program" ✓ first-year-consistent. Adrian "outfield dev", Jeremiah "hitting/infield" — accurate to their real roles? |
| 6.2 | Mike's bio lead | team.json:62 | Rewrite pending — D1-athlete-as-credibility angle. Claude drafts, you approve. |
| 6.3 | Karin's credentials | team.json:62 | "3× NCAA champ, 11× All-American gymnast at Georgia" — keep, trim, or cut? |

---

## What's clean (✅ OK)

- **Internal links**: zero broken. All `/#roster`, `/#about`, `/#schedule`, `/#coaches`, `/#contact`, `/recruiting#inquiry`, `/coaches#schedule` anchors resolve.
- **`/contact`, `/recruiting`**: content clean, correctly data-bound.
- **Player data structure**: sound; `recruitingStatus`/`committedTo` exist (just not bound in coaches.astro).
- **Approved image sources** in players.json: Cloudinary + Twitter CDN only (no celebrity URLs leaked into player data).

---

## Recommended fix order

**Batch A — Critical, no input needed (do now):**
- 1.2 (18U→16U), 2.2 (remove phone), 2.3 (info@→gmail), 3.1+3.2 (season label), 3.4 (add AFCA), 5.1 (bind recruitingStatus), 4.1 (/coordinator redirect)

**Batch B — Needs your headshots / one confirmation:**
- 1.1 (4 real photos), 1.3 (50+ scouts: verify or swap), 2.1 (mailto→forms)

**Batch C — Routing decisions:**
- 4.2 (/recruit intent), 4.3 (/events keep/delete)

**Batch D — Durability (SEO-supporting):**
- 5.2 (Cloudinary photo migration), 6.2 (your bio rewrite)

---

## Open decisions blocking nothing in Batch A

1. **1.3** — Is "50+ D1 scouts" defensible? If no, I swap to the championships.
2. **2.1** — Zero emails public (forms only), or `mikeusry@gmail.com` OK on gated family pages?
3. **4.2** — `/recruit/[slug]` = private coach-share (keep, noindex) or fold into `/players/[slug]`?
4. **4.3** — `/events/[slug]` keep (wire to schedule) or delete?

I can start Batch A immediately while you decide B/C.
