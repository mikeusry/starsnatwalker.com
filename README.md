# Stars National Walker

Official website for Stars National Walker, an elite 18U travel softball team based in Atlanta, GA.

## Tech Stack

- **Framework:** [Astro](https://astro.build/) v5
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) v4
- **Hosting:** [Cloudflare Pages](https://pages.cloudflare.com/)

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment

This site is automatically deployed to Cloudflare Pages on push to `main`.

**Live URL:** https://starsnatwalker.com

### Manual Deploy

```bash
npm run build
npx wrangler pages deploy dist
```

## Project Structure

```
src/
├── components/     # Astro components
│   ├── Header.astro
│   ├── Hero.astro
│   ├── PlayerCard.astro
│   ├── Roster.astro
│   ├── Schedule.astro
│   ├── About.astro
│   ├── Contact.astro
│   └── Footer.astro
├── data/          # JSON data files
│   ├── team.json
│   ├── players.json
│   └── schedule.json
├── layouts/       # Page layouts
│   └── Layout.astro
├── pages/         # Route pages
│   └── index.astro
└── styles/        # Global styles
    └── global.css
```

## Updating Content

### Players
Edit `src/data/players.json` to add/update player information.

### Schedule
Edit `src/data/schedule.json` to update tournament schedule.

### Team Info
Edit `src/data/team.json` for team-wide information.

## Brand Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Navy | `#0a1628` | Primary background |
| Red | `#c41e3a` | Accent, CTAs |
| Gold | `#d4af37` | Highlights, badges |

## Related Projects

- [AynParkerUsry.com](https://aynparkerusry.com) - Individual player recruiting site template
- [program-match](https://github.com/mikeusry/program-match) - College softball discovery platform
