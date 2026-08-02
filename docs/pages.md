# Pages

Route pages for Stars National Walker website.

## Page Structure

```
src/pages/
├── index.astro          # Homepage
├── contact.astro        # Contact page
└── players/
    └── [slug].astro     # Dynamic player profile pages
```

---

## index.astro

Homepage with all main sections.

### Route

```
/
```

### Features

- Hero section with team branding
- Complete roster grid
- Tournament schedule
- About section (team + coaches)
- Contact form
- Full-page layout with all components

### Components Used

- `Header` (transparent)
- `Hero`
- `Roster`
- `Schedule`
- `About`
- `Contact`
- `Footer`

### SEO

- Title: "Stars National Walker | Elite 18U Travel Softball"
- Meta description from team.json
- Open Graph tags for social sharing

---

## contact.astro

Standalone contact page with detailed team contact information.

### Route

```
/contact
```

### Features

- Full contact form
- All coach contact details
- Recruiting coordinator info
- Social media links
- Team phone and email

### Components Used

- `Header`
- `Contact` (standalone mode)
- `Footer`

### When to Use

- Direct link for recruiting inquiries
- Email signature links
- Tournament materials
- Social media profiles

---

## players/[slug].astro

Dynamic player profile pages generated from players.json data.

### Route Pattern

```
/players/[slug]
```

### Example URLs

- `/players/ayn-parker-usry`
- `/players/maddie-diaz`
- `/players/sophia-perez`

### How It Works

1. **Build Time** - Astro reads `players.json` and generates static pages for each player
2. **Slug Generation** - `slug` field from JSON determines URL (e.g., "ayn-parker-usry")
3. **Static Export** - Each player gets a pre-rendered HTML file

### getStaticPaths()

The page uses Astro's `getStaticPaths()` to generate all player routes:

```typescript
export async function getStaticPaths() {
  const players = (await import('../../data/players.json')).default;

  return players.map(player => ({
    params: { slug: player.slug },
    props: { player }
  }));
}
```

This generates routes for all players in `players.json` at build time.

### Page Sections

1. **Hero** - Player name, photo, key stats
2. **Quick Stats** - Grad year, position, bats, throws
3. **Bio** - Player biography and playing style
4. **Stats Table** - Performance metrics (exit velocity, batting avg, etc.)
5. **Honors** - Awards and achievements
6. **Video** - Embedded highlight reel (YouTube/Vimeo)
7. **Social Links** - X/Twitter, Instagram, etc.
8. **Back to Roster** - Navigation button

### Data Requirements

**Minimum fields (to generate page):**
- `id`
- `first_name`
- `last_name`
- `slug`
- `grad_year`
- `primary_position`

**Recommended fields (complete profile):**
- `bio`
- `headshot_url`
- `highlight_video_url`
- `social_links.twitter`
- At least 3 performance metrics

### Adding New Player Pages

1. Add player to `src/data/players.json`:
```json
{
  "id": "uuid-here",
  "first_name": "First",
  "last_name": "Last",
  "slug": "first-last",
  "grad_year": 2027,
  "primary_position": "SS",
  "bio": "Player biography...",
  "headshot_url": "https://...",
  "highlight_video_url": "https://youtube.com/...",
  "social_links": {
    "twitter": "https://x.com/username"
  }
}
```

2. Rebuild site:
```bash
npm run build
```

3. New page automatically generated at `/players/first-last`

### Slug Generation Rules

**Valid slugs:**
- Lowercase letters, numbers, hyphens only
- No spaces (use hyphens instead)
- No special characters (@, #, $, etc.)
- Must be unique across all players

**Examples:**
- ✅ `ayn-parker-usry`
- ✅ `maddie-diaz`
- ✅ `sophia-perez`
- ❌ `Ayn Parker Usry` (spaces, uppercase)
- ❌ `maddie@diaz` (special characters)
- ❌ `sophia_perez` (underscores not recommended)

### Player Page SEO

Each player page includes:
- Dynamic title: `{First Last} | Stars National Walker`
- Meta description from player bio (first 160 characters)
- Open Graph image from headshot_url
- Structured data (Person schema)
- Canonical URL

### Tracking & Analytics

Player pages include pd-pixel tracking for:
- Profile views
- Video plays
- Contact clicks
- Referrer tracking (college coach domains)

See [Tracking README](../lib/README.md) for details.

---

## Creating New Pages

To add a new static page:

1. **Create file** in `src/pages/newpage.astro`
2. **Define layout** with Header and Footer
3. **Add content** sections
4. **Update navigation** in Header component (if needed)

### Template

```astro
---
import Layout from '../layouts/Layout.astro';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
---

<Layout title="Page Title | Stars National Walker">
  <Header />
  <main>
    <section class="py-16">
      <div class="container-narrow">
        <h1 class="text-4xl font-bold text-stars-navy mb-6">
          Page Title
        </h1>
        <p class="text-gray-700">
          Page content...
        </p>
      </div>
    </section>
  </main>
  <Footer />
</Layout>
```

### Auto-Generated Routes

Astro automatically converts file structure to routes:

| File | Route |
|------|-------|
| `index.astro` | `/` |
| `contact.astro` | `/contact` |
| `about.astro` | `/about` |
| `players/[slug].astro` | `/players/*` |
| `tournaments/index.astro` | `/tournaments/` |

---

## Future Pages (Planned)

### Privacy Policy (`/privacy`)
- Cookie notice
- Data collection disclosure
- GDPR compliance
- Coach tracking transparency

### Recruiting Resources (`/recruiting`)
- Timeline and process
- College database
- Camp calendar
- NCAA rules overview

### Media Gallery (`/media`)
- Team photos
- Action shots
- Tournament coverage
- Embedded video playlists

---

## Dynamic Routes Best Practices

1. **Unique slugs** - Ensure no duplicate slugs in data
2. **Error handling** - Handle missing player data gracefully
3. **404 pages** - Create custom 404.astro for invalid slugs
4. **Redirects** - Set up redirects for old player URLs if slugs change
5. **Build validation** - Test build locally before deploying

---

## Build Process

### Development

```bash
npm run dev
```

- Hot reload on file changes
- Dynamic routes work immediately
- Player pages accessible at `/players/[slug]`

### Production Build

```bash
npm run build
```

- Pre-renders all pages to static HTML
- Generates routes for all players
- Optimizes assets and images
- Output to `dist/` directory

### Preview Build

```bash
npm run preview
```

- Serves production build locally
- Test before deploying

---

## Troubleshooting

### Player Page Not Generating

**Symptom:** Player exists in JSON but page doesn't build

**Possible causes:**
1. Invalid slug (contains invalid characters)
2. Missing required fields (check console for errors)
3. Duplicate slug (must be unique)
4. JSON syntax error (validate JSON format)

**Solution:**
```bash
npm run build 2>&1 | grep -i error
```

Look for validation errors in build output.

### 404 on Player Page

**Symptom:** Player page returns 404 in production

**Possible causes:**
1. Player added after last build (rebuild needed)
2. Slug mismatch (URL doesn't match slug in JSON)
3. Deployment issue (check Cloudflare Pages logs)

**Solution:**
1. Verify slug in `players.json` matches URL
2. Rebuild and redeploy
3. Check Cloudflare Pages build logs

### Missing Player Data

**Symptom:** Player page loads but shows incomplete info

**Cause:** Optional fields not populated in JSON

**Solution:** Add missing fields to player entry in `players.json`

---

## Related Documentation

- [Data Schemas](../data/README.md) - Player data structure
- [Components](../components/README.md) - Components used in pages
- [Tracking](../lib/README.md) - Analytics setup
- [Root README](../../README.md) - Project overview and deployment
