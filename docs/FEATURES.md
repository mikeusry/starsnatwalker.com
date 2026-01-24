# Recruiting Features

Advanced recruiting tools for maximizing player scholarship opportunities.

## Overview

The Stars National Walker platform combines professional player profiles with data-driven recruiting intelligence to help every player secure a college scholarship.

**Core Philosophy:** Success in recruiting = **Visibility + Persistence + Timing**

This platform systematizes all three.

---

## Current Features

### 1. Professional Player Profiles

Individual recruiting pages for each player at `/players/[slug]`.

**Includes:**
- Professional headshots and action photos
- Comprehensive stats and metrics
- Highlight video integration
- Direct contact information
- Social media links
- Bio and playing style description

**Benefits:**
- Single shareable link for coaches
- Professional presentation
- Always up-to-date information
- Mobile-optimized viewing

**Usage:**
- Share link in email outreach
- Add to tournament rosters
- Include in social media profiles
- Print on recruiting cards

---

### 2. Team Roster Hub

Central roster at `/` with all players.

**Features:**
- Searchable grid layout
- Filter by grad year
- Quick player previews
- Direct links to profiles

**Benefits:**
- Easy coach browsing
- Team-wide visibility
- Cross-promotion between players
- Showcase depth of roster

---

### 3. Tournament Schedule

Public schedule display at `/#schedule`.

**Includes:**
- Upcoming tournaments with dates/locations
- Past tournament results
- Team achievements
- External tournament links

**Benefits:**
- Coach recruiting calendar
- Easy for coaches to find you at events
- Demonstrates competitive level
- Proof of tournament participation

---

## Coming Soon (In Development)

### 🔥 pd-pixel Coach Tracking

**Status:** Implementation planned

**What It Does:**
Track which college coaches view which players.

**Data Captured:**
- Player profile views
- Video watch events
- Contact link clicks
- Referrer sources (college websites)
- Geographic location
- Visit timestamps

**Why It Matters:**
- Know which coaches are interested
- Identify hot leads
- Prove ROI to families
- Prioritize follow-up outreach
- Track campaign effectiveness

**How to View:**
- Weekly email reports to recruiting coordinator
- Program Match admin dashboard
- Per-player analytics

**Implementation:**
- Tracking pixel on all pages
- Server-side data enrichment
- Privacy-compliant (hashed IPs)
- GDPR-ready data handling

---

### 📊 Recruiting Activity Feed

**Status:** Implementation planned

**What It Does:**
Public feed showing recent coach interest on homepage.

**Examples:**
- "Coach from University of Georgia viewed Riley Walker's profile 2 hours ago"
- "3 D1 coaches watched Maddie Diaz's highlight video this week"
- "Sophia Perez received interest from 12 programs this month"

**Why It Matters:**
- **FOMO Effect:** Creates urgency ("If UGA is interested, I should be too")
- **Social Proof:** Validates player credibility
- **Momentum:** Shows active recruiting process
- **Parent Engagement:** Families see tangible results

**Privacy:**
- Coach names anonymized (unless .edu domain identified)
- Aggregated stats only (not individual timestamps)
- No personal data exposed

---

### 📧 Weekly Analytics Reports

**Status:** Implementation planned

**What It Does:**
Automated weekly email to recruiting coordinator with traffic analytics.

**Includes:**
- Total player profile views
- Top 5 viewed players
- Geographic breakdown (countries/states)
- Identified coach views (.edu domains)
- Video engagement metrics
- Week-over-week trends

**Benefits:**
- Data-driven recruiting decisions
- Identify which players need more promotion
- Track campaign effectiveness
- Prove value to families

**Delivery:**
- Every Monday at 9am UTC
- Email to recruiting coordinator
- Plain text format
- Link to full analytics dashboard

---

## Future Enhancements (Roadmap)

### Real-Time Coach Alerts

**When a D1 coach views a player 3+ times, notify recruiting coordinator immediately.**

- Email alerts
- SMS notifications
- Slack integration
- Configurable thresholds

### Coach Dashboard

**Aggregated recruiting intelligence across entire team.**

- Heat map of coach interest
- Division breakdown (D1, D2, D3, NAIA)
- Geographic interest mapping
- Timeline of recruiting activity
- Export to CSV for analysis

### Email Sequence Builder

**Automated follow-up campaigns for coach outreach.**

- Template library
- Scheduled sends
- Open/click tracking
- A/B testing
- CRM integration

### Downloadable Player Packets

**One-click PDF generation for tournament distribution.**

- Professional layout
- QR code to player profile
- Embedded stats and video thumbnails
- Print-ready format
- Bulk export for whole team

### College Match Finder

**AI-powered college recommendations based on player profile.**

- Academic fit (GPA + test scores + major)
- Athletic fit (stats + position + division)
- Geographic preferences
- Financial aid estimates
- Contact information for coaches

### Commitment Tracker

**Public commitment board celebrating player signings.**

- Commitment announcements
- School logos and colors
- Social media auto-posting
- Historical commitment data
- Success metrics by division

---

## Integration Opportunities

### AthletesGoLive

**Status:** Future consideration

**Potential:**
- Auto-import game stats
- Live streaming integration
- Highlight clip extraction
- Tournament results sync

**Requirements:**
- AthletesGoLive team account
- API access (if available)
- Video processing pipeline

### GameChanger

**Status:** Future consideration

**Potential:**
- Automatic stats sync (batting avg, OBP, HR, RBIs)
- Game-by-game performance tracking
- Season stat updates
- No manual data entry needed

**Requirements:**
- GameChanger team subscription
- API access
- Real-time or scheduled sync

### SportsRecruits / FieldLevel

**Status:** Future consideration

**Potential:**
- Cross-platform profile sync
- Coach network integration
- Communication tracking
- Centralized inbox

---

## How Coaches See the Site

### First Impression

Coach clicks player link from email or social media:

1. **Lands on player profile** - Professional layout, clear stats
2. **Views highlight video** - Embedded YouTube, easy playback
3. **Checks social media** - X/Twitter for personality/updates
4. **Sees team context** - Link to full roster
5. **Takes action** - Email link or phone call

### What Coaches Look For

**Immediate (< 10 seconds):**
- Grad year and position
- Height and handedness
- Video quality

**Secondary (< 1 minute):**
- Stats and metrics
- High school and GPA
- Tournament schedule (can I see her play?)
- Bio and playing style

**Tertiary (> 1 minute):**
- Team accomplishments
- Coaching staff credibility
- Social media activity
- Email/phone contact

### Mobile Experience

70% of coaches view profiles on mobile:

- Responsive design (works on all screen sizes)
- Fast loading (Cloudflare edge network)
- Easy tap targets (contact buttons, social links)
- Video optimized for mobile playback
- No horizontal scrolling

---

## Privacy & Compliance

### What We Track

- Anonymous visitor IDs (cookies)
- Page views and video plays
- Referrer URLs (where traffic came from)
- Device information (browser, screen size)
- Geographic location (country/state only)
- IP addresses (hashed for privacy)

### What We DON'T Track

- Coach names (unless voluntarily provided)
- Personal identifying information
- Email addresses (unless submitted via form)
- Sensitive personal data

### GDPR Compliance

- Cookie notice on site
- Right to access data
- Right to deletion
- Data retention: 90 days for raw events
- Aggregated data retained indefinitely

### For Coaches

Coaches visiting the site should know:

- We track visits to improve recruiting
- Data is anonymized
- No personal information collected without consent
- Can opt-out via browser settings

---

## How to Use These Features

### For Recruiting Coordinator

**Weekly routine:**
1. Check Sunday email report
2. Identify top viewed players
3. Note any .edu domain visits
4. Follow up with interested coaches
5. Update players on interest

**Monthly review:**
1. Analyze trends (which players getting most views?)
2. Adjust marketing (promote underviewed players)
3. Report to families
4. Optimize outreach campaigns

### For Players & Families

**Profile optimization:**
1. Keep stats updated after tournaments
2. Add new highlight videos
3. Update social media links
4. Refresh bio seasonally
5. Add achievements as they happen

**Sharing profiles:**
1. Email link to interested coaches
2. Add to email signature
3. Include on recruiting cards
4. Post to social media
5. Add to tournament rosters

### For Coaches

**Effective usage:**
1. Add to team branding materials
2. Include in email outreach templates
3. Share during parent meetings
4. Print QR codes for recruiting cards
5. Post to social media regularly

---

## Technical Implementation

See implementation details in:
- [Tracking Library](../src/lib/README.md) - pd-pixel integration
- [Plan File](../.claude/plans/swirling-whistling-bengio.md) - Full implementation plan

---

## Success Metrics

**Player-level:**
- Profile views per month
- Video completion rate
- Contact link clicks
- Geographic reach
- Coach engagement (returning visitors)

**Team-level:**
- Total views across roster
- Unique coach visitors
- Division distribution (D1 vs D2 vs D3)
- Conversion rate (view → contact → commit)

**Goal:** Every player gets 50+ coach views per month during active recruiting season.

---

## Questions?

Contact recruiting coordinator:
- Mike Usry
- mike@point.dog
- Program Match platform
