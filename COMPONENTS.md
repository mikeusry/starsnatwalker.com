# Component Library - Stars National Walker

## Design System

### Brand Colors (use inline styles for reliability)
| Color | Hex | Usage |
|-------|-----|-------|
| Navy | `#062a4b` | Primary background, text |
| Navy Light | `#0a3d6a` | Secondary backgrounds, gradients |
| Blue | `#3b82f6` | Links, accent text, titles |
| Gold | `#FFD700` | Primary CTA buttons, highlights |
| Silver | `#C0C0C0` | Secondary text, badges |
| White | `#ffffff` | Text on dark backgrounds |

> **IMPORTANT:** Tailwind classes like `bg-stars-gold` and `text-stars-gold` are NOT rendering properly in this project. Always use inline styles for gold/accent colors: `style="background-color: #FFD700; color: #062a4b;"`

### Typography
- Font: Inter (system fallback)
- Headings: `font-bold`, sizes from `text-xl` to `text-6xl`
- Body: `text-gray-600` (light bg) or `text-white/80` (dark bg)

### Spacing
- Section padding: `section-padding` class (py-16 md:py-20 px-4 md:px-8)
- Container: `container-narrow` class (max-w-6xl mx-auto px-4)
- Card gaps: `gap-6` or `gap-8`

### Button Classes (defined in global.css)
- `.btn-primary` - Navy bg, white text
- `.btn-secondary` - Navy outline, navy text
- `.btn-accent` - Silver bg, navy text
- `.btn-action` - Blue bg, white text

> **Note:** For gold buttons, use inline styles instead of classes.

---

## Layout Components

### Header.astro
**Purpose:** Fixed navigation header with logo and nav links
**Props:**
- `transparent?: boolean` - Transparent background (for hero overlays)

**Features:**
- Desktop nav with regular links and highlighted buttons
- Mobile hamburger menu
- Scroll-based background change
- Social link (X/Twitter)

**Nav Link Types:**
- Regular: `{ href, label }`
- Primary CTA: `{ href, label, highlight: 'primary' }` - Gold button
- Secondary CTA: `{ href, label, highlight: 'secondary' }` - White outline button

---

### Footer.astro
**Purpose:** Site footer with brand, links, contact info
**Sections:**
- Brand column with logo and social links
- Quick Links column
- College Coaches column
- Contact column
- Bottom bar with copyright

**Data:** Pulls from `team.json`

---

### Layout.astro
**Purpose:** Base HTML layout wrapper
**Props:**
- `title: string` - Page title
- `description: string` - Meta description

**Includes:** Meta tags, OG tags, global styles

---

## Page Section Components

### Hero.astro
**Purpose:** Homepage hero with team photo background
**Features:**
- Full-height hero with overlay
- Team name, tagline, division badge
- Dual CTA buttons
- Scroll indicator

---

### Roster.astro
**Purpose:** Player roster grid for homepage
**Features:**
- Grid of PlayerCard components
- Alphabetical sorting by last name
- Link to coaches page for college coaches

---

### PlayerCard.astro
**Purpose:** Individual player card
**Props:**
- `player: object` - Player data from players.json

**Displays:** Name, position, grad year, jersey number, hometown

---

### Schedule.astro
**Purpose:** Tournament schedule section
**Features:**
- Upcoming/past event filtering
- Event cards with date, location, organization badges
- "No upcoming events" state

---

### About.astro
**Purpose:** About section with team description
**Features:**
- Text content with feature highlights
- Icon + title + description cards

---

### CoachesSection.astro
**Purpose:** Coaching staff grid for homepage
**Features:**
- Shows all coaches + recruiting coordinator equally
- Avatar circles, names, titles, email links

---

### CoachContact.astro
**Purpose:** Reusable coach contact section
**Props:**
- `title?: string` - Section heading
- `description?: string` - Section subheading
- `variant?: 'light' | 'dark'` - Color scheme
- `showAllCoaches?: boolean` - Show all or just head coach

**Use on:** Contact page, Coaches page, Player profile pages

---

### Contact.astro
**Purpose:** Contact form section for homepage
**Features:**
- Contact form with fields
- Side info panel

---

## Pages

### index.astro (Homepage)
**Components used:**
- Layout, Header (transparent), Hero, Roster, Schedule, About, CoachesSection, Contact, Footer

### coaches.astro (College Coach Resources)
**Components used:**
- Layout, Header, Footer, CoachContact
- Custom hero section
- Full roster table
- Full schedule

### contact.astro (Contact Page)
**Components used:**
- Layout, Header, Footer, CoachContact
- Custom hero section
- Contact form

### tryout.astro (Player Application)
**Components used:**
- Layout, Header, Footer, CoachContact
- Custom hero section
- Benefits grid (custom)
- Organization section (custom)
- "What We're Looking For" section (custom)
- Pitcher callout (custom)
- Application form (custom)

### players/[slug].astro (Player Profile)
**Components used:**
- Layout, Header, Footer, CoachContact
- Custom player profile layout

### brand.astro (Brand Guidelines)
**Components used:**
- Layout, Header, Footer
- Custom brand documentation

---

## Patterns to Reuse

### Section Hero (Dark)
```html
<section class="relative bg-stars-navy py-20 md:py-28 overflow-hidden">
  <div class="container-narrow relative">
    <div class="text-center max-w-4xl mx-auto">
      <!-- Badge -->
      <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-6"
           style="background-color: rgba(192, 192, 192, 0.2); color: #C0C0C0;">
        <!-- content -->
      </div>
      <h1 class="text-4xl md:text-6xl font-bold text-white mb-6">Title</h1>
      <p class="text-xl text-white/80 mb-8">Subtitle</p>
      <!-- Buttons -->
    </div>
  </div>
</section>
```

### Card Grid
```html
<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
  <div class="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
    <!-- Icon -->
    <div class="w-14 h-14 bg-stars-navy rounded-xl flex items-center justify-center mb-4">
      <svg class="w-7 h-7" fill="#FFD700" ...>
    </div>
    <h3 class="text-xl font-bold text-gray-900 mb-2">Title</h3>
    <p class="text-gray-600">Description</p>
  </div>
</div>
```

### Gold Button (inline styles required)
```html
<a href="#"
   class="inline-flex items-center justify-center px-8 py-4 font-bold text-lg rounded-lg transition-all hover:opacity-90"
   style="background-color: #FFD700; color: #062a4b;">
  Button Text
</a>
```

### Icon Circle (dark bg)
```html
<div class="w-16 h-16 rounded-full flex items-center justify-center"
     style="background-color: rgba(255, 255, 255, 0.2);">
  <svg class="w-8 h-8" fill="none" stroke="#ffffff" viewBox="0 0 24 24">
    <!-- path -->
  </svg>
</div>
```

---

## Data Files

- `src/data/team.json` - Team info, coaches, contact, social links
- `src/data/players.json` - Player roster data
- `src/data/schedule.json` - Tournament schedule

---

## Components Needed (Future)

- [ ] `SectionHeader.astro` - Reusable section title + subtitle
- [ ] `IconCard.astro` - Reusable icon + title + description card
- [ ] `BenefitCard.astro` - For tryout page benefits (could extract)
- [ ] `FormField.astro` - Reusable form input component

---

## Audit Notes

### tryout.astro
**Custom markup that could be componentized:**
1. Benefits grid cards - Could extract to `BenefitCard.astro`
2. "What We're Looking For" cards - Similar pattern to benefits
3. Pitcher callout section - One-off, OK to keep inline

### Design Consistency Issues Fixed:
- All gold colors now use inline `style="#FFD700"` instead of Tailwind classes
- Coach cards now have consistent styling (no special treatment for head coach)
- Nav buttons properly differentiate primary (gold) vs secondary (outline)
