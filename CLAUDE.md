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

## TODO

### Next Session
- [ ] Test coach inquiry form (submit test, verify Supabase + SendGrid)
- [ ] Add tracking pixel to player pages so dashboard has data
- [ ] Get email addresses for all players and set up forwarding
- [ ] Upload all player photos to Cloudinary (stop depending on Twitter CDN)

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
