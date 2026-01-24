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
├── components/     # Astro components (See: src/components/README.md)
│   ├── Header.astro
│   ├── Hero.astro
│   ├── PlayerCard.astro
│   ├── Roster.astro
│   ├── Schedule.astro
│   ├── About.astro
│   ├── Contact.astro
│   └── Footer.astro
├── data/          # JSON data files (See: src/data/README.md)
│   ├── team.json
│   ├── players.json
│   └── schedule.json
├── layouts/       # Page layouts
│   └── Layout.astro
├── lib/           # Utilities & tracking (See: src/lib/README.md)
│   └── tracking.ts
├── pages/         # Route pages (See: src/pages/README.md)
│   ├── index.astro
│   ├── contact.astro
│   └── players/
│       └── [slug].astro  # Dynamic player profiles
└── styles/        # Global styles
    └── global.css

docs/              # Documentation
└── FEATURES.md    # Recruiting features overview
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

## Recruiting Features

This site includes advanced recruiting intelligence tools:

### Current Features
- Professional player profile pages
- Team roster hub
- Tournament schedule display
- Direct coach contact links

### Coming Soon
- **pd-pixel Coach Tracking** - Track which coaches view which players
- **Recruiting Activity Feed** - Public FOMO-driven activity display
- **Weekly Analytics Reports** - Email reports with coach engagement data

See [docs/FEATURES.md](./docs/FEATURES.md) for complete feature documentation.

## Documentation

- [Player Data Collection Checklist](./PLAYER-CHECKLIST.md)
- [Recruiting Features Overview](./docs/FEATURES.md)
- [Component Documentation](./src/components/README.md)
- [Data Schemas](./src/data/README.md)
- [Page Routes](./src/pages/README.md)
- [Tracking Library](./src/lib/README.md)

## Related Projects

- [AynParkerUsry.com](https://aynparkerusry.com) - Individual player recruiting site template
- [program-match](https://github.com/mikeusry/program-match) - College softball discovery platform
