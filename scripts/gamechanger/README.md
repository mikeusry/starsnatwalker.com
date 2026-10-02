# GameChanger stats → EIS rankings nominations

Extra Inning Softball (EIS) ranks each class once a year, from nominations
submitted at [myeis360.com/nominate](https://myeis360.com/nominate). This folder
turns GameChanger season exports into a per-player approval packet (PDF) for
Coach Joe Walker, and holds the evidence EIS asks for.

**This repo is public.** `eis-*/` is gitignored: it holds the coach's phone and
email and GameChanger screenshots (which show the logged-in account), so those
live only on Mike's machine at `scripts/gamechanger/eis-<class>/`.

**Not website data.** None of this writes to `src/data/players.json` unless
`import.mjs --write` is run on purpose. The packet is for marketing the kids to
EIS, not for the site.

## Where everything lives

| What | Where |
|---|---|
| GameChanger CSV exports (Team › Stats › Export) | `raw/2025-fall.csv`, `raw/2026-summer.csv` |
| Combined stat sheet (per season + combined) | `out/eis-stats-fall2025-summer2026.{csv,json}` |
| GameChanger stat screenshots (EIS verification) | `eis-2028/gc-screenshots/` (gitignored) |
| Action photos (one per girl) | `eis-2028/action-photos/` (gitignored) |
| Coach / nominator phone + email | `eis-2028/coach.json` (gitignored) |
| Approval PDF + HTML (**has parent phones/emails, never commit**) | `~/Desktop/EIS Nominations 2028/` |
| Parent / guardian contacts (gitignored) | `functions/api/_family-contacts.json` — same data as program-match `families` (Supabase `dludfgxxjstzpbrrysqp`) |
| Headshots, positions, achievements | `src/data/players.json` |
| Tournament names for the season | `TOURNAMENTS` in `eis-packet.mjs` |
| twitterapi.io key (for `x-media.mjs`) | `~/CODING/program-match/.env` → `TWITTERAPI_IO_KEY` |

GameChanger team IDs (web.gc.com/teams/&lt;id&gt;): Fall 2025 `1N7Sp0CgOJMh`,
Summer 2026 `b6iRI9h4y7mK`, Fall 2026 `RT5F7uGH902m`. GameChanger records dates
and venues but **not tournament names**; the team posts a game-schedule graphic
per tournament on X (`@StarsNatWalker`, and reposted by the girls), and those
graphics are the best source for names. Before Aug 2026 the summer schedule was
in `src/data/schedule.json` (`git show 8d5f4f5~1:src/data/schedule.json`).

## Workflow

1. **Check the tracker** — [myeis360.com/nomination-status](https://myeis360.com/nomination-status).
   One nomination per athlete; skip anyone already listed and add her id to
   `ALREADY_NOMINATED` in `eis-packet.mjs`.
2. **Export stats** from GameChanger for every season in EIS's stats window
   (travel ball only) into `raw/`, then `node scripts/gamechanger/import.mjs`.
   Every recomputed rate is checked against GameChanger's own; a mismatch prints.
3. **Screenshot each girl's season stats** in GameChanger (her player page ›
   Stats, with the Totals row visible) into `eis-<class>/gc-screenshots/` as
   `<first>-<last>-<season>-<batting|pitching|catching>.png`.
4. **Action photos** — `x-media.mjs` lists a girl's X photos (`--video` for
   video previews, where most game action is). Save one as
   `<first>-<last>-action.jpg` in `eis-<class>/action-photos/`.
5. **Build the packet** — `node scripts/gamechanger/eis-packet.mjs`. Yellow
   `NEED` boxes are the coach's fill-ins. Send the PDF to Joe for approval.
6. **Submit** on myeis360.com/nominate (5-step form, coach = nominator, one
   submission per girl), stopping on the final screen for a human to click Submit.

## Combining seasons

Sum the counting stats, then recompute — never average rates:
AVG = H/AB · OBP = (H+BB+HBP)/(AB+BB+HBP+SF) · SLG = TB/AB · ERA = ER×7/IP ·
WHIP = (H+BB)/IP · CS% = CS/ATT · FPCT = (PO+A)/TC. IP is in outs (x.1 = 1 out).
Opponent BAA is taken from GameChanger as-is (at-bats against aren't exported).

## Class of 2028 (Oct 2026) — status

Deadline Oct 5, 2026, 11:59 PM Mountain. Already nominated: Maddie Diaz, Sara
Utrera (Stars National Walker); Keira Frazier (by EC Bullets Mayfield).
In the packet: Austyn Kinch, Charlotte Llaneza, Cara Orlando, Sophia Perez,
Lyla Seibert, Kierra Wunderlich. Ayn Parker Usry reclassed to 2029 (GameChanger
still says 2028). Open items as of Oct 2: Austyn's parent contact; Charlotte's
action photo, skills video, pop time; Sophia's skills video; a solo headshot for
Kierra (her action photo is from 2024 with DI White 13U).

Class of 2029 nominations open Dec 28, 2026 – Jan 25, 2027: copy `eis-2028/`
to `eis-2029/` (or start it empty), then set `CLASS`, `DEADLINE`,
`ALREADY_NOMINATED` and `TOURNAMENTS` in `eis-packet.mjs`.
