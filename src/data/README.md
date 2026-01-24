# Data Files

JSON data files for Stars National Walker team website.

## Files

- [`team.json`](./team.json) - Team information, coaches, contact details
- [`players.json`](./players.json) - Player roster with profiles and stats
- [`schedule.json`](./schedule.json) - Tournament schedule and achievements

---

## team.json

Team-wide information including coaches and contact details.

### Schema

```typescript
interface Team {
  name: string;                    // Full team name
  shortName: string;               // Short display name
  division: string;                // Age division (e.g., "18U")
  season: string;                  // Current season
  location: string;                // Home location
  organization: string;            // Parent organization
  coaches: Coach[];                // Array of coaches
  headCoach: Coach;                // Reference to head coach
  recruitingCoordinator: Contact;  // Recruiting coordinator info
  description: string;             // Team bio
  socialLinks: {
    twitter?: string;
    instagram?: string;
    facebook?: string;
  };
  achievements: string[];          // Recent accomplishments
  contactEmail: string;            // General inquiry email
  contactPhone: string;            // Team phone number
}

interface Coach {
  name: string;      // Full name
  title: string;     // Role (e.g., "Head Coach")
  email: string;     // Contact email
  bio?: string;      // Coach biography
}

interface Contact {
  name: string;      // Full name
  title: string;     // Role
  email: string;     // Contact email
  bio?: string;      // Biography
}
```

### Required Fields
- `name`
- `division`
- `season`
- `location`
- `coaches` (at least one)
- `contactEmail`

### Optional Fields
- `shortName` (defaults to `name`)
- `headCoach` (can be derived from coaches array)
- `recruitingCoordinator`
- `socialLinks`
- `achievements`
- `contactPhone`

### Usage

```astro
---
import team from '../data/team.json';
---

<h1>{team.name}</h1>
<p>{team.description}</p>

{team.coaches.map(coach => (
  <div>
    <h3>{coach.name}</h3>
    <p>{coach.title}</p>
  </div>
))}
```

### Updating

To update team information, edit `team.json` directly. Changes will be reflected on next build/deploy.

**Common updates:**
- Adding new coaches: Add to `coaches` array
- Changing season: Update `season` field
- Adding achievements: Append to `achievements` array
- Updating social links: Modify `socialLinks` object

---

## players.json

Complete roster with player profiles, stats, and recruiting information.

### Schema

```typescript
interface Player {
  // Identity (Required)
  id: string;                     // UUID from database
  first_name: string;             // First name
  last_name: string;              // Last name
  slug: string;                   // URL slug (e.g., "ayn-parker-usry")

  // Academic (Required)
  grad_year: number;              // Graduation year (e.g., 2027)
  high_school?: string;           // High school name
  gpa?: number;                   // GPA (0.0-4.0 scale)

  // Position (Required)
  primary_position: string;       // Main position (e.g., "SS", "P", "C")
  secondary_positions?: string[]; // Additional positions

  // Physical Stats
  height?: string;                // Height (e.g., "5'7\"")
  bats?: 'L' | 'R' | 'S';        // Batting hand
  throws?: 'L' | 'R';            // Throwing hand

  // Bio & Content
  bio?: string;                   // Player biography (2-3 paragraphs)
  playing_style?: string;         // Playing style description

  // Media
  headshot_url?: string;          // Profile photo URL
  action_photos?: string[];       // Action shot URLs
  highlight_video_url?: string;   // YouTube/Vimeo URL
  youtube_channel?: string;       // YouTube channel URL

  // Performance Metrics
  exit_velocity?: number;         // mph
  sixty_yard_dash?: number;       // seconds
  throwing_velocity?: number;     // mph
  batting_average?: number;       // Decimal (e.g., 0.350)
  on_base_percentage?: number;    // Decimal (e.g., 0.450)
  slugging_percentage?: number;   // Decimal (e.g., 0.600)
  home_runs?: number;             // Season total
  rbis?: number;                  // Season total

  // Honors & Awards
  honors?: string[];              // Array of achievements

  // Contact & Social
  social_links?: {
    twitter?: string;             // X/Twitter handle
    instagram?: string;
    tiktok?: string;
  };
  contact_email?: string;         // Recruiting contact email

  // Recruiting Status
  commitment_status?: 'Uncommitted' | 'Committed' | 'Signed';
  committed_school?: string;      // If committed
  ncaa_id?: string;              // NCAA Eligibility Center ID
  division_preferences?: string[];// ['D1', 'D2', 'D3', 'NAIA', 'JUCO']
}
```

### Required Fields (Minimum Viable Profile)
- `id`
- `first_name`
- `last_name`
- `slug`
- `grad_year`
- `primary_position`

### Recommended Fields (Complete Profile)
Add these for a recruiting-ready profile:
- `bio`
- `headshot_url`
- `highlight_video_url`
- `social_links.twitter`
- `height`, `bats`, `throws`
- `high_school`
- At least 3 performance metrics

### Usage

```astro
---
import players from '../data/players.json';

// Get all players
const roster = players;

// Filter by grad year
const class2027 = players.filter(p => p.grad_year === 2027);

// Get single player by slug
const player = players.find(p => p.slug === 'ayn-parker-usry');
---
```

### Updating Players

**Adding a new player:**

1. Get player data from Program Match database
2. Add entry to `players.json` with all available fields
3. Ensure `slug` is unique and URL-friendly
4. Verify headshot and video URLs are accessible
5. Build and deploy

**Updating stats:**

Edit the player's entry in `players.json`:
```json
{
  "id": "uuid-here",
  "batting_average": 0.385,
  "home_runs": 12,
  "rbis": 48
}
```

### Data Source

Player data originates from the Program Match database (`player_profiles` table) and is synced to this JSON file for static site generation.

To sync latest data from database:
```bash
cd /path/to/program-match
npm run scripts/export-stars-roster.ts > /path/to/starsnatwalker.com/src/data/players.json
```

---

## schedule.json

Tournament schedule and past achievements.

### Schema

```typescript
interface Schedule {
  upcoming: Tournament[];
  past: Tournament[];
  achievements: Achievement[];
}

interface Tournament {
  name: string;              // Tournament name
  date: string;              // Date or date range
  location: string;          // City, State
  type?: string;             // "Showcase", "Qualifier", "Championship"
  link?: string;             // Tournament website
}

interface Achievement {
  title: string;             // Achievement description
  date?: string;             // When accomplished
  tournament?: string;       // Related tournament
}
```

### Required Fields
- `upcoming` array (can be empty)
- `past` array (can be empty)

### Optional Fields
- `achievements` (defaults to empty array)

### Usage

```astro
---
import schedule from '../data/schedule.json';
---

<h2>Upcoming Tournaments</h2>
{schedule.upcoming.map(tournament => (
  <div>
    <h3>{tournament.name}</h3>
    <p>{tournament.date} • {tournament.location}</p>
  </div>
))}
```

### Updating Schedule

**Adding upcoming tournament:**
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

**Moving tournament to past:**
Move from `upcoming` to `past` array after event concludes.

**Adding achievement:**
```json
{
  "achievements": [
    "Alliance Atlantic Region Champions - Fall 2025",
    "PGF Show Me The Money - 2nd Place - March 2026"
  ]
}
```

---

## Validation

All JSON files are validated on build. Common errors:

### Syntax Errors
```
Error: Unexpected token } in JSON at position 123
```
**Fix:** Check for trailing commas, missing quotes, unmatched brackets

### Missing Required Fields
```
Error: players.json - Player missing required field: grad_year
```
**Fix:** Add the required field to the player entry

### Invalid URLs
```
Warning: Invalid URL format for highlight_video_url
```
**Fix:** Ensure URLs start with `http://` or `https://`

---

## Best Practices

1. **Keep data up-to-date** - Update stats after major tournaments
2. **Validate URLs** - Test all video and photo URLs before committing
3. **Consistent formatting** - Use same date format throughout (e.g., "Month DD, YYYY")
4. **Backup before editing** - JSON syntax errors can break the build
5. **Use proper slugs** - URL slugs should be lowercase with hyphens (e.g., "first-last")

---

## Related Documentation

- [Player Data Checklist](../../PLAYER-CHECKLIST.md) - Guide for collecting player information
- [Component Usage](../components/README.md) - How components consume this data
- [Dynamic Routes](../pages/README.md) - How player pages are generated from data
