# X Player Profile Series — Spec

**Account:** [@StarsNatWalker](https://x.com/StarsNatWalker) (team account, not player accounts)
**Cadence:** 2 posts/week — Tuesday + Thursday
**Scope:** all 17 players, 2028s first
**Status:** spec — not yet approved to post
**Owner:** Mike
**Written:** 2026-08-09

---

## Why this exists

Discovery is the bottleneck. Every visit to a player page today arrives `direct` or
refer-chained off starsnatwalker.com — meaning the coach *already knew where to look*.
Nothing in the current system creates awareness among coaches who have never heard of
these girls. Email reaches the ones we already found. This series is for the ones we
haven't.

**What this is not:** a click-optimization play. Success is a coach seeing a name enough
times that it's familiar when Joe texts them, or when she shows up at a camp. Clicks are
the measurable proxy, not the goal.

---

## The roster constraint (decided)

**8 of 17 players have video. 9 have none.** That fact drives the format.

| | Players |
|---|---|
| **Has clips** | Elise Barbour (10), Ayn Parker Usry (8), Keira Frazier (6), Cara Orlando (3), Kierra Wunderlich (3), Kendall LaManche (1), Lyla Seibert (2), Austyn Kinch (1) |
| **No clips** | Baylee Giese Edney, Maddie Diaz, Kelsey Fliss, Avery Jones, Charlotte Llaneza, Sophia Perez, Riley Walker, Sara Utrera, Natalie Ireland Hall |

**Decision: everyone rotates (option B), and the schedule creates the pressure to fill the
gaps (option C).** A video-gated series would post the same 8 girls on a 4-week loop while
9 families watch their daughters get skipped on the team account. That is a visible
fairness problem, and the parents notice it long before the coaches do.

Practical upside: "your profile post goes out week 6" is the most effective deadline
anyone has found for getting a family to send clips.

---

## Post anatomy

Two formats. Same skeleton, different center.

### Format A — Video post (players with clips)

```
[Grad year] · [Position] · [State]

[Name] — [one hook line: the single most arresting fact]

[stat line: 2-3 numbers, each one a coach can act on]

@[herhandle]
[tracked link]

[native video: the single best clip, uploaded to X — NOT a link to Mux]
```

### Format B — Card post (players without clips)

Identical, but the media slot is her Cloudinary headshot composited with a stat card.
All 17 have a `photoUrl` already, so there is no asset gap.

### Rules that apply to both

- **Video is uploaded natively to X.** Never a link out to a player page for the clip —
  X suppresses off-platform link reach, and a coach will not click through to watch.
  The link is for the ones who want *more* after the clip already sold them.
- **One hook, not a résumé.** The bio has 200–1600 characters. The post gets one line.
  Everything else is what the link is for.
- **Numbers over adjectives.** "1.30 ERA, No. 1 in Virginia" beats "dominant arm."
  Coaches read stat lines; they skip prose.
- **Tag her handle.** All 17 have one (decided — see below).
- **No coach @-mentions.** Never tag a program or a coach in a recruiting post. It reads
  as pressure, and it puts the coach in an awkward position publicly.

---

## Tagging (decided: yes)

Every post tags the player's own handle. All 17 exist in `players.json` as `twitter`.

Rationale: these are already public recruiting accounts, created for exactly this purpose.
Tagging lets her repost to her own network, which is where her school, her travel
teammates, and her local coaches live — reach the team account does not have on its own.

**Guardrail:** the team account tags the player. Players are never asked to tag coaches,
and the team account never does either.

---

## Tracked links (verified working — no new code needed)

**Every link carries UTM params.** Untracked links are structurally forbidden in this
system, and X traffic is exactly the case that would otherwise dissolve into `direct`.

```
https://starsnatwalker.com/players/<slug>/?utm_source=x&utm_medium=social&utm_campaign=profile-series-<gradyear>
```

**Verified end-to-end against production on 2026-08-09**, not assumed:

- `Layout.astro:178-180` reads `utm_source` / `utm_medium` / `utm_campaign` from the query
  string, stores them in `sessionStorage` as `pd_attr`, and merges them into
  `event_data.attribution` on every subsequent event in the session.
- A probe POST to the live `/api/track` with a `t.co` referrer stored
  `referrer_domain: "t.co"`, the full campaign object, and `is_bot: false`.

So a coach who clicks from X is attributable through the whole session — the landing view
and any video play after it. **This works today. No code required to start.**

**Read the results with:** `/admin/pixel-log`, filtering `referrer_domain = t.co`. X
wraps every link in `t.co`, so that domain *is* the X channel.

⚠️ Do not shorten links through any other service. A second redirect can strip the query
string and the click becomes invisible.

---

## Schedule — 2028s first

**Why 2028 first:** their contact dates are live now. The 2029s are the longer game and
lose nothing by going second.

Ordering principle: **lead with the strongest clip**, because a video post with a real
highlight travels several times further than a card, and the first posts set whether
anyone follows the series at all. Video and card posts alternate where possible so the
feed never shows two static cards back to back.

### Phase 1 — the 2028s (5 weeks, 10 posts)

| Wk | Tue | Format | Hook | Thu | Format | Hook |
|---|---|---|---|---|---|---|
| 1 | **Keira Frazier** | 🎥 video (6) | 70 exit velo / 68 IF velo / 10.98 home-to-home; VISAA state champ, 4x200 school + state record | **Austyn Kinch** | 🎥 video (1) | .543 avg, .588 OBP, 1.523 OPS over 28 games; 1.76 pop time; WIAA state champs |
| 2 | **Cara Orlando** | 🎥 video (3) | 74 mph exit velo; two-out 3-run HR won the sectional; HS HR leader 2 straight years | **Sophia Perez** | 🖼️ card | Hit .560 as a sophomore; Pueblo MVP; 4.17 GPA; EIS Ambassador |
| 3 | **Kierra Wunderlich** | 🎥 video (3) | 2x USSSA All-American RHP | **Maddie Diaz** | 🖼️ card | NC all-state as a sophomore; undefeated 7A state champions; lefty slapper |
| 4 | **Lyla Seibert** | 🎥 video (2) | 5.174 GPA, SC Junior Scholar; middle IF with range and a quick release | **Sara Utrera** | 🖼️ card | 2025 FHSAA 6A state champion; All-County 1st Team |
| 5 | **Avery Jones** | 🖼️ card | 6'0" power RHP / 1B; honor roll | **Charlotte Llaneza** | 🖼️ card | Catcher/3B; strong arm, quick release out of the crouch |

Week 5 is two cards back to back — unavoidable, since the video players are exhausted by
then. **This is the natural deadline for Avery's and Charlotte's families to send clips.**
If either sends video before week 5, the post upgrades to Format A.

### Phase 2 — the 2029s (weeks 6–9)

Elise Barbour (10 clips), Ayn Parker Usry (8), Kendall LaManche (1), then Baylee Giese
Edney, Kelsey Fliss, Riley Walker, Natalie Ireland Hall (cards).

Ayn rotates as a normal entry, no special placement.

Sequenced after Phase 1 approval — the 2028 run will teach us what works before we commit
the strongest material (Elise's 10 clips) to a format we haven't tested.

---

## What we measure

Weekly, from `/admin/pixel-log`:

1. **`referrer_domain = t.co` view count** — the honest number. Zero today.
2. **Views per post**, attributed by `utm_campaign` + landing `player_slug`.
3. **Video plays from X sessions** — did the clip drive them to watch *more*?
4. **New cities** — the real signal. An unfamiliar metro appearing after a post is a
   coach who did not previously know the program existed. That is what this is for.

**Baseline before we start:** 138 non-bot events in the trailing 30 days, **0 from t.co**.

### Two honest caveats

- **Attribution undercounts.** A coach who sees a post, remembers the name, and searches
  later arrives as `direct` and is invisible to this measurement. Awareness plays always
  measure low. Do not kill the series on click count alone.
- **Geography ≠ coach.** Some restored traffic already traces to player home states
  (Appleton WI = Kierra + Austyn; CO = Sophia). Check a new city against the roster
  *before* reading it as a coach.

---

## Open items

- [ ] Card template design for Format B — must hold its own beside a video post
- [ ] Approval flow: who signs off before a post goes live (assume Mike, confirm)
- [ ] Do we need parent consent on file for tagging minors' accounts from the team
      account? Public recruiting accounts, and standard practice — but worth a
      conscious decision rather than a default
- [ ] Phase 2 detailed calendar — after Phase 1 runs

## Related

- Untracked links are forbidden — see `feedback_every_link_must_track` in project memory
- Bot filter caveat: `project_pixel_bot_rule_ate_humans` (Chrome upper bound retired
  2026-08-09; ~half of real traffic was invisible before that)
- Coaches respond by **texting Joe**, not by email or reply — `project_coaches_text_coordinator`
