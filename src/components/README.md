# Components

Astro components for Stars National Walker team website.

## Component List

| Component | Purpose | Location |
|-----------|---------|----------|
| [Header.astro](#headerastro) | Navigation bar | All pages |
| [Hero.astro](#heroastro) | Homepage hero section | Homepage |
| [Roster.astro](#rosterastro) | Player grid display | Homepage |
| [PlayerCard.astro](#playercardastro) | Individual player card | Roster section |
| [Schedule.astro](#scheduleastro) | Tournament schedule | Homepage |
| [About.astro](#aboutastro) | Team & coaches info | Homepage |
| [Contact.astro](#contactastro) | Contact form section | Homepage, Contact page |
| [Footer.astro](#footerastro) | Site footer | All pages |

---

## Header.astro

Main navigation bar with responsive mobile menu.

### Props

```typescript
interface Props {
  transparent?: boolean;  // If true, uses transparent background (for hero overlay)
}
```

### Usage

```astro
---
import Header from '../components/Header.astro';
---

<!-- Default header (solid background) -->
<Header />

<!-- Transparent header (for pages with hero images) -->
<Header transparent />
```

### Features

- Responsive mobile hamburger menu
- Active link highlighting
- Sticky positioning on scroll
- Navigation links: Home | Roster | Schedule | About | Contact

### Styling

Uses Stars National branding colors:
- Background: Navy (`#062a4b`)
- Accent: Red (`#c41e3a`)
- Mobile menu: 768px breakpoint

---

## Hero.astro

Homepage hero section with team branding and CTA.

### Props

No props - uses team data from `../data/team.json`

### Usage

```astro
---
import Hero from '../components/Hero.astro';
---

<Hero />
```

### Features

- Full-width hero with gradient background
- Team name and tagline
- Season and location info
- CTA button linking to roster
- Social media links

### Customization

To change hero text, edit `src/data/team.json`:
```json
{
  "name": "Stars National Walker",
  "division": "18U",
  "season": "2025-2026",
  "location": "Atlanta, GA"
}
```

---

## Roster.astro

Player grid displaying all roster members.

### Props

No props - fetches players from `../data/players.json`

### Usage

```astro
---
import Roster from '../components/Roster.astro';
---

<section id="roster">
  <Roster />
</section>
```

### Features

- Responsive grid layout (1-4 columns based on screen size)
- Auto-generates player cards
- Links to individual player pages
- Filters active players only
- Sorts by grad year, then last name

### Customization

The roster automatically updates when players are added to `players.json`.

---

## PlayerCard.astro

Individual player card component used in roster grid.

### Props

```typescript
interface Props {
  player: Player;  // Player object from players.json
}

interface Player {
  id: string;
  first_name: string;
  last_name: string;
  slug: string;
  grad_year: number;
  primary_position: string;
  headshot_url?: string;
  social_links?: {
    twitter?: string;
  };
}
```

### Usage

```astro
---
import PlayerCard from '../components/PlayerCard.astro';
import players from '../data/players.json';
---

{players.map(player => (
  <PlayerCard player={player} />
))}
```

### Features

- Displays player headshot (or placeholder)
- Shows name, grad year, position
- Links to X/Twitter if available
- Hover effects
- Links entire card to player profile page (`/players/[slug]`)

### Styling

- Card aspect ratio: 4:5 (portrait)
- Rounded corners with shadow
- Red accent on hover
- Fallback image for missing headshots

---

## Schedule.astro

Tournament schedule and achievements display.

### Props

No props - uses schedule data from `../data/schedule.json`

### Usage

```astro
---
import Schedule from '../components/Schedule.astro';
---

<section id="schedule">
  <Schedule />
</section>
```

### Features

- Two-column layout (Upcoming | Past)
- Achievements banner
- Tournament cards with date, location, type
- External tournament links
- Responsive mobile stacking

### Data Structure

Expects schedule.json with:
```json
{
  "upcoming": [...],
  "past": [...],
  "achievements": [...]
}
```

See [Data README](../data/README.md#schedulejson) for full schema.

---

## About.astro

Team information and coaching staff section.

### Props

No props - uses team data from `../data/team.json`

### Usage

```astro
---
import About from '../components/About.astro';
---

<section id="about">
  <About />
</section>
```

### Features

- Team description
- Coach cards with photos, bios, contact
- Recruiting coordinator info
- Grid layout for multiple coaches
- Email links for each coach

### Customization

To update coaches, edit `team.json`:
```json
{
  "coaches": [
    {
      "name": "Adrian Diaz",
      "title": "Head Coach",
      "email": "adrian.diaz@starsnational.com",
      "bio": "Coach bio here..."
    }
  ],
  "recruitingCoordinator": {
    "name": "Mike Usry",
    "title": "Recruiting Coordinator",
    "email": "mike@point.dog",
    "bio": "Coordinator bio..."
  }
}
```

---

## Contact.astro

Contact form and team contact information.

### Props

```typescript
interface Props {
  standalone?: boolean;  // If true, includes section wrapper (for contact page)
}
```

### Usage

```astro
---
import Contact from '../components/Contact.astro';
---

<!-- Embedded in homepage -->
<Contact />

<!-- Standalone contact page -->
<Contact standalone />
```

### Features

- Contact form (Name, Email, Phone, Message)
- Team contact info (email, phone)
- Coach contact details
- Social media links
- Form submission (handled client-side)

### Form Handling

Currently client-side only. To add backend submission:

1. Create form handler endpoint
2. Update form action attribute
3. Add loading states and validation

---

## Footer.astro

Site footer with navigation and social links.

### Props

No props - uses team data from `../data/team.json`

### Usage

```astro
---
import Footer from '../components/Footer.astro';
---

<Footer />
```

### Features

- Team logo and name
- Quick navigation links
- Social media icons (X/Twitter, Instagram)
- Copyright notice (auto-updates year)
- Responsive layout

### Styling

- Navy background (`#062a4b`)
- White/gray text
- Hover effects on links
- Mobile-friendly stacking

---

## Component Composition

### Typical Page Structure

```astro
---
import Layout from '../layouts/Layout.astro';
import Header from '../components/Header.astro';
import Hero from '../components/Hero.astro';
import Roster from '../components/Roster.astro';
import Schedule from '../components/Schedule.astro';
import About from '../components/About.astro';
import Contact from '../components/Contact.astro';
import Footer from '../components/Footer.astro';
---

<Layout title="Stars National Walker">
  <Header transparent />
  <main>
    <Hero />
    <Roster />
    <Schedule />
    <About />
    <Contact />
  </main>
  <Footer />
</Layout>
```

---

## Styling Guidelines

All components use:
- **Tailwind CSS 4** for styling
- **Stars National brand colors** (see root README)
- **Responsive breakpoints**: sm (640px), md (768px), lg (1024px), xl (1280px)
- **Container classes**: `container-narrow` for max-width content

### Brand Colors

Use these Tailwind classes:
- `bg-stars-navy` - Primary navy background
- `bg-stars-navy-light` - Lighter navy
- `bg-stars-red` - Red accent
- `bg-stars-gold` - Gold highlights
- `text-stars-*` - Text colors

---

## Creating New Components

1. **Create file** in `src/components/NewComponent.astro`
2. **Define props** with TypeScript interface
3. **Import data** if needed from `../data/*.json`
4. **Use consistent styling** with Tailwind + brand colors
5. **Add to this README** with usage examples

### Template

```astro
---
interface Props {
  title: string;
  optional?: boolean;
}

const { title, optional = false } = Astro.props;
---

<div class="component-wrapper">
  <h2 class="text-stars-navy font-bold">{title}</h2>
  {optional && <p>Optional content</p>}
</div>

<style>
  /* Component-specific styles if needed */
  .component-wrapper {
    /* Scoped styles */
  }
</style>
```

---

## Testing Components

### Visual Testing

1. Start dev server: `npm run dev`
2. Visit http://localhost:4321
3. Check responsive behavior (mobile, tablet, desktop)
4. Verify all links work
5. Test form interactions

### Build Testing

```bash
npm run build
npm run preview
```

Ensures components work in production build.

---

## Related Documentation

- [Data Schemas](../data/README.md) - JSON data structure
- [Page Routes](../pages/README.md) - How pages use components
- [Root README](../../README.md) - Project overview
