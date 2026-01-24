# Contributing to Stars National Walker

Thank you for helping maintain and improve the Stars National Walker recruiting platform!

## Quick Start

```bash
# Clone repo
git clone https://github.com/yourusername/starsnatwalker.com.git
cd starsnatwalker.com

# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

---

## Common Tasks

### Adding a New Player

1. **Get player data** from Program Match database or player questionnaire
2. **Create player entry** in `src/data/players.json`:

```json
{
  "id": "uuid-from-database",
  "first_name": "First",
  "last_name": "Last",
  "slug": "first-last",
  "grad_year": 2027,
  "primary_position": "SS",
  "bio": "Player biography (2-3 paragraphs)",
  "headshot_url": "https://...",
  "highlight_video_url": "https://youtube.com/...",
  "social_links": {
    "twitter": "https://x.com/username"
  },
  "height": "5'7\"",
  "bats": "R",
  "throws": "R",
  "high_school": "School Name",
  "gpa": 3.8
}
```

3. **Verify required fields** are present:
   - `id`, `first_name`, `last_name`, `slug`, `grad_year`, `primary_position`

4. **Ensure slug is unique** and URL-friendly:
   - Lowercase only
   - Use hyphens (not underscores or spaces)
   - No special characters

5. **Test locally**:
```bash
npm run dev
# Visit http://localhost:4321/players/first-last
```

6. **Commit and push**:
```bash
git add src/data/players.json
git commit -m "Add player: First Last (Class of 2027)"
git push
```

### Updating Player Stats

Edit the player's entry in `src/data/players.json`:

```json
{
  "id": "existing-uuid",
  "batting_average": 0.385,
  "home_runs": 12,
  "rbis": 48,
  "exit_velocity": 75,
  "sixty_yard_dash": 7.2
}
```

**Best practices:**
- Update stats after major tournaments
- Keep highlight videos current (within 1 season)
- Refresh player photos annually
- Update bio when achievements change

### Adding a Tournament

Edit `src/data/schedule.json`:

**Upcoming tournament:**
```json
{
  "upcoming": [
    {
      "name": "PGF Nationals",
      "date": "July 20-24, 2026",
      "location": "Huntington Beach, CA",
      "type": "Championship",
      "link": "https://pgfastpitch.com"
    }
  ]
}
```

**After tournament concludes:**
1. Move from `upcoming` to `past` array
2. Add any achievements to `achievements` array

### Updating Photos

**Headshots:**
- Recommended size: 800x1000px (4:5 aspect ratio)
- Format: JPG or PNG
- Max file size: 500KB
- Upload to CDN or hosting service
- Add URL to player's `headshot_url` field

**Action photos:**
- Add to player's `action_photos` array
- Use consistent quality and aspect ratio

### Adding Coaches

Edit `src/data/team.json`:

```json
{
  "coaches": [
    {
      "name": "Coach Name",
      "title": "Assistant Coach",
      "email": "coach@starsnational.com",
      "bio": "Coach biography..."
    }
  ]
}
```

---

## Development Guidelines

### Code Style

- Use **Tailwind CSS** for styling (no custom CSS unless necessary)
- Follow existing component patterns
- Keep components small and focused
- Use TypeScript interfaces for props

### File Naming

- Components: `PascalCase.astro` (e.g., `PlayerCard.astro`)
- Pages: `lowercase.astro` or `[slug].astro` for dynamic routes
- Data files: `lowercase.json`
- Utilities: `camelCase.ts`

### Component Props

Always define TypeScript interfaces:

```astro
---
interface Props {
  title: string;
  optional?: boolean;
}

const { title, optional = false } = Astro.props;
---
```

### Data Validation

JSON files are validated on build. Common errors:

- **Trailing commas**: Remove commas after last item in arrays/objects
- **Missing quotes**: All strings must be quoted
- **Invalid URLs**: Must start with `http://` or `https://`

---

## Git Workflow

### Branch Naming

- `feature/player-name` - Adding new players
- `fix/issue-description` - Bug fixes
- `update/data-sync` - Data updates
- `docs/section-name` - Documentation

### Commit Messages

Follow conventional commit format:

```
type(scope): description

Examples:
- feat(players): Add Maddie Diaz profile
- fix(roster): Fix sorting by grad year
- update(stats): Update tournament stats for March
- docs(readme): Add deployment instructions
- style(header): Update mobile menu colors
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `update` - Data or content update
- `docs` - Documentation
- `style` - Styling changes
- `refactor` - Code refactoring
- `test` - Testing
- `chore` - Maintenance

### Pull Request Process

1. **Create feature branch**:
```bash
git checkout -b feature/new-player
```

2. **Make changes and commit**:
```bash
git add .
git commit -m "feat(players): Add new player profile"
```

3. **Push to remote**:
```bash
git push origin feature/new-player
```

4. **Create PR** on GitHub with:
   - Clear description of changes
   - Screenshots for visual changes
   - Link to related issues

5. **Wait for review** from recruiting coordinator or team lead

6. **Address feedback** if requested

7. **Merge** after approval

---

## Testing

### Local Testing

```bash
# Development mode (hot reload)
npm run dev

# Production build
npm run build
npm run preview
```

### Checklist Before Committing

- [ ] All pages load without errors
- [ ] Player profiles display correctly
- [ ] Links work (X/Twitter, videos, emails)
- [ ] Mobile responsive (test at 375px, 768px, 1024px)
- [ ] No console errors
- [ ] JSON files are valid
- [ ] Build completes successfully

### Testing Player Pages

Visit these URLs in dev mode:
- `/` - Homepage
- `/contact` - Contact page
- `/players/ayn-parker-usry` - Sample player profile
- `/players/[new-slug]` - Newly added player

---

## Deployment

### Automatic Deployment

Commits to `main` branch auto-deploy to Cloudflare Pages.

**Process:**
1. Push to `main`
2. Cloudflare Pages detects change
3. Runs `npm run build`
4. Deploys to production
5. Live at https://starsnatwalker.com

**Typical deploy time:** 1-2 minutes

### Manual Deployment

```bash
# Build locally
npm run build

# Deploy to Cloudflare Pages
npx wrangler pages deploy dist
```

### Verifying Deployment

1. Visit https://starsnatwalker.com
2. Check updated content appears
3. Test new player pages
4. Verify no broken links

---

## Troubleshooting

### Build Fails

**Check for:**
- JSON syntax errors (trailing commas, missing quotes)
- Invalid URLs in player data
- Missing required fields
- Duplicate slugs

**Debug:**
```bash
npm run build 2>&1 | grep -i error
```

### Player Page Not Generating

**Possible causes:**
1. Invalid slug (contains special characters)
2. Missing required fields
3. JSON syntax error

**Solution:**
1. Validate JSON at https://jsonlint.com
2. Check slug is lowercase with hyphens only
3. Ensure all required fields present

### Images Not Loading

**Check:**
- URL is accessible (test in browser)
- URL starts with `http://` or `https://`
- Image file exists at URL
- No CORS issues (if loading from external CDN)

### Changes Not Appearing

1. **Clear browser cache**: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
2. **Hard reload dev server**: Stop and restart `npm run dev`
3. **Rebuild**: `npm run build && npm run preview`

---

## Project Structure Reference

```
starsnatwalker.com/
├── src/
│   ├── components/     # Reusable Astro components
│   ├── data/           # JSON data files
│   ├── layouts/        # Page layouts
│   ├── lib/            # Utilities and tracking
│   ├── pages/          # Routes (index, contact, players/[slug])
│   └── styles/         # Global CSS
├── public/             # Static assets (images, favicon)
├── docs/               # Documentation
└── README.md           # Main documentation
```

See individual README files in each directory for detailed documentation.

---

## Code of Conduct

- Be respectful and professional
- Focus on the goal: helping players get scholarships
- Protect player privacy and data
- Test thoroughly before committing
- Document changes clearly
- Ask questions if unsure

---

## Getting Help

**Questions about:**
- **Code/tech**: Check docs in `src/*/README.md` files
- **Data/players**: Contact recruiting coordinator
- **Deployment**: Check Cloudflare Pages logs
- **Features**: See [docs/FEATURES.md](./docs/FEATURES.md)

**Contact:**
- Recruiting Coordinator: Mike Usry - mike@point.dog
- GitHub Issues: Create issue for bugs or feature requests

---

## Resources

- [Astro Documentation](https://docs.astro.build)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Cloudflare Pages](https://developers.cloudflare.com/pages)
- [Component Docs](./src/components/README.md)
- [Data Schemas](./src/data/README.md)

---

## Thank You!

Every contribution helps our players get noticed by college coaches and achieve their dreams of playing at the next level. 🥎⭐
