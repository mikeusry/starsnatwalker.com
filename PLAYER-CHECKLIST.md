# Stars National Walker - Player Profile Checklist

Based on [AynParkerUsry.com](https://aynparkerusry.com) model.

## Data Collection Checklist per Player

### ✅ Essential (Required for Page Launch)
- [ ] **Full Name** (First + Last)
- [ ] **Grad Year** (Class of 20XX)
- [ ] **Primary Position**
- [ ] **X/Twitter Handle** (@username)
- [ ] **Professional Headshot** (high-res, action or portrait)

### 📊 Core Stats & Metrics
- [ ] **Height** (e.g., 5'7")
- [ ] **Bats** (L/R/Switch)
- [ ] **Throws** (L/R)
- [ ] **Secondary Positions** (if any)
- [ ] **High School** (Name + City, State)
- [ ] **GPA** (e.g., 3.8 / 4.0)

### ⚾ Performance Metrics
- [ ] **Exit Velocity** (mph)
- [ ] **60-Yard Dash** (seconds)
- [ ] **Throwing Velocity** (mph, by position)
- [ ] **Batting Average** (season/career)
- [ ] **Home Runs** (season/career)
- [ ] **RBIs** (season/career)
- [ ] **OBP** (On-Base Percentage)
- [ ] **Slugging %**

### 🏆 Honors & Achievements
- [ ] All-Conference
- [ ] All-Region
- [ ] All-State
- [ ] Academic All-American
- [ ] Tournament MVPs
- [ ] Team Captain
- [ ] Other awards/recognitions

### 🎥 Media
- [ ] **Highlight Video URL** (YouTube/Vimeo)
- [ ] **YouTube Channel** (if they have one)
- [ ] **Action Photos** (2-3 additional photos)
- [ ] **Fielding Video** (optional)
- [ ] **At-Bat Compilation** (optional)

### 📱 Social & Contact
- [ ] **Instagram Handle** (if public)
- [ ] **TikTok Handle** (if applicable)
- [ ] **Contact Email** (for recruiting inquiries)
- [ ] **Parent/Guardian Contact** (optional)

### 📝 Narrative Content
- [ ] **Bio** (2-3 paragraphs about player journey, strengths, goals)
- [ ] **Playing Style** (1-2 sentences)
- [ ] **Academic Interests** (intended major, career goals)
- [ ] **Why Softball** (personal story/motivation)
- [ ] **Team Contributions** (leadership, specific role)

### 🎓 Academic & College Recruiting
- [ ] **NCAA ID** (if registered)
- [ ] **SAT/ACT Scores** (if available and willing to share)
- [ ] **Academic Honors** (Honor Roll, National Honor Society, etc.)
- [ ] **Intended Major**
- [ ] **Commitment Status** (Uncommitted / Committed to [School])
- [ ] **Division Preferences** (D1, D2, D3, NAIA, JUCO)
- [ ] **Geographic Preferences** (regions willing to consider)

### 🗓️ Tournament & Showcase Schedule
- [ ] Upcoming showcases
- [ ] Tournament schedule
- [ ] College camps attending

---

## Current Roster Status

| Player | Headshot | X Handle | Stats | Bio | Video | Status |
|--------|----------|----------|-------|-----|-------|--------|
| **Ayn Parker Usry** | ❌ | ✅ | ❌ | ❌ | ❌ | 🟡 Minimal |
| **Sophia Perez** | ❌ | ✅ | ❌ | ❌ | ❌ | 🟡 Minimal |
| **Maddie Diaz** | ❌ | ✅ | ❌ | ❌ | ❌ | 🟡 Minimal |
| **Gia Bono** | ❌ | ✅ | ❌ | ❌ | ❌ | 🟡 Minimal |
| **Riley Walker** | ❌ | ✅ | ❌ | ❌ | ❌ | 🟡 Minimal |
| **Findlay Bel** | ❌ | ✅ | ❌ | ❌ | ❌ | 🟡 Minimal |
| **Kelsey Fliss** | ❌ | ✅ | ❌ | ❌ | ❌ | 🟡 Minimal |
| **Avery Jones** | ❌ | ✅ | ❌ | ❌ | ❌ | 🟡 Minimal |
| **Sara Utrera** | ❌ | ✅ | ❌ | ❌ | ❌ | 🟡 Minimal |
| **Lyla Seibert** | ❌ | ✅ | ❌ | ❌ | ❌ | 🟡 Minimal |
| **Charlotte** | ❌ | ✅ | ❌ | ❌ | ❌ | 🟡 Minimal |
| **Keira Frazier** | ❌ | ✅ | ❌ | ❌ | ❌ | 🟡 Minimal |
| **Cara Orlando** | ❌ | ✅ | ❌ | ❌ | ❌ | 🟡 Minimal |
| **K Lamanche** | ❌ | ✅ | ❌ | ❌ | ❌ | 🟡 Minimal |

**Legend:**
- 🟢 Complete (all essential data + most optional)
- 🟡 Minimal (name + X handle only)
- 🔴 Missing (needs immediate attention)

---

## Data Collection Process

1. **Send Player/Family Questionnaire** - Google Form or Typeform with all fields
2. **Request Photos** - Dropbox/Google Drive link for high-res uploads
3. **Video Collection** - Request YouTube links or help upload to team channel
4. **Stats Verification** - Confirm with GameChanger or team records
5. **Review & Approval** - Player/family reviews profile before going live

---

## Priority Order

1. **Ayn Parker Usry** - Already has separate site, should be most complete
2. **2027-2028 Grads** - Active recruiting window (Maddie, Sophia, Gia, Findlay, etc.)
3. **2029+ Grads** - Lower priority, build out over time

---

## Technical Implementation

Each player page will be at: `/players/[slug]` (e.g., `/players/ayn-parker-usry`)

Template sections:
1. Hero with headshot + key stats
2. About/Bio
3. Stats & Metrics table
4. Honors & Achievements
5. Video highlight reel (embedded YouTube)
6. Contact/Recruiting CTA
7. Social links footer

Data stored in: `src/data/players/[slug].json`
