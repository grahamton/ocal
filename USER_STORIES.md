# Ocal User Stories & Use Cases

## Primary User Persona

### Meet Carol & Jim

**Demographics**:

- Age: 65-70
- Location: Duluth, Minnesota (Lake Superior shoreline)
- Activity: Daily beach walks (5+ miles)
- Tech comfort: Basic smartphone users

**Goals**:

- Identify rocks they find on beach walks
- Keep a record of their collection
- Learn about geology
- Share finds with family

**Pain Points**:

- Can't identify rocks by sight alone
- Forget where they found special specimens
- Lose track of their collection
- Existing apps too complicated

**Needs**:

- Large, readable text
- Simple, intuitive interface
- Works offline (no cell service on beach)
- Fast, doesn't slow them down

---

## Core User Journeys

### Journey 1: Morning Beach Walk

**Context**: Carol and Jim start their daily 5-mile beach walk at 7 AM.

**Steps**:

1. **Start Session**

   - Open Ocal app
   - Tap "Start Session" (optional - auto-creates if needed)
   - Name it "Morning Walk - Dec 30" or use default

2. **Find First Rock**

   - Spot interesting agate near water
   - Tap camera icon
   - Take photo (app captures GPS automatically)
   - Rock saved as "draft" in gallery
   - Continue walking

3. **Find More Rocks**

   - Repeat 10-15 times during walk
   - Each capture takes ~5 seconds
   - No need to stop and catalog immediately

4. **Return Home**
   - End session (optional)
   - Now have 15 finds from today's walk

**Success Criteria**:

- ✅ Capture is fast (< 5 seconds per rock)
- ✅ Works offline (no cell service on beach)
- ✅ Doesn't interrupt walking flow
- ✅ All finds grouped by session

---

### Journey 2: Identifying Finds at Home

**Context**: Back home with coffee, reviewing today's finds.

**Steps**:

1. **Open Gallery**

   - See all 15 finds from morning walk
   - Thumbnails show photos clearly
   - Status badges: "NEW" (blue) for unprocessed

2. **Batch Analyze**

   - Tap "Analyze All (15)" button
   - AI processes all finds in background
   - Continue browsing while processing

3. **Review Results**

   - Gallery auto-updates as AI completes
   - Badges change: "NEW" → "Analyzed" (green)
   - See confidence % on each card

4. **Check Individual Finds**

   - Tap interesting one
   - See AI identification: "Banded Agate (87% confident)"
   - Read description, characteristics
   - Tap "Apply to Logbook" to use AI name

5. **Add Personal Notes**
   - Tap "+ Add notes"
   - Type: "Found near the pier, beautiful banding"
   - Mark as favorite ⭐
   - Save

**Success Criteria**:

- ✅ AI identifies rocks accurately
- ✅ Batch processing (don't do one-by-one)
- ✅ Clear confidence levels
- ✅ Easy to add personal context

---

### Journey 3: Reviewing Collection

**Context**: Weekend afternoon, showing collection to visiting grandkids.

**Steps**:

1. **Switch to List View**

   - Tap list icon in gallery
   - See all finds with metadata visible
   - Easier to scan than grid

2. **Filter by Type**

   - Tap "Analyzed" filter
   - See only identified rocks
   - Sort by confidence or date

3. **Find Specific Rock**

   - Remember finding great agate last week
   - Scroll through list
   - See "Brighton Beach • Dec 23"
   - Tap to open

4. **Share Story**
   - Show photo to grandkids
   - Read AI description aloud
   - Share where/when found
   - Explain why it's special

**Success Criteria**:

- ✅ Easy to browse collection
- ✅ Multiple view modes (grid/list)
- ✅ Filtering works well
- ✅ Metadata visible at a glance

---

### Journey 4: Understanding Patterns

**Context**: Curious about collecting habits over time.

**Steps**:

1. **Open Insights**

   - Tap analytics icon in header
   - See dashboard with stats

2. **Discover Patterns**

   - "Best Finding Times: Morning (60%)"
   - "Most Common: Banded Agate (23 finds)"
   - "Hot Spots: Area 1 (15 finds)"

3. **Adjust Behavior**
   - Realize morning walks are most productive
   - Note that certain beach areas have more agates
   - Plan future walks accordingly

**Success Criteria**:

- ✅ Insights are meaningful
- ✅ Data visualized clearly
- ✅ Actionable information

---

## Secondary Use Cases

### Use Case: Offline Identification

**Scenario**: On beach with no cell service

**Flow**:

1. Capture rock photos (works offline)
2. Walk continues, no interruption
3. Return home, connect to WiFi
4. App auto-processes queued items
5. Notifications when AI completes (future)

**Why it matters**: Most beach areas have poor/no cell service

---

### Use Case: Batch Delete

**Scenario**: Captured some rocks that turned out to be common

**Flow**:

1. Long-press on first unwanted find
2. Enter selection mode
3. Tap other unwanted finds
4. Tap delete button
5. Confirm deletion
6. All removed at once

**Why it matters**: Don't want collection cluttered with common rocks

---

### Use Case: Favorite Tracking

**Scenario**: Want to remember best finds

**Flow**:

1. Open special find
2. Tap star icon
3. Star turns gold
4. Filter gallery by favorites (future)
5. See only best specimens

**Why it matters**: Some finds are more special than others

---

## User Needs by Priority

### Must Have (P0)

1. **Fast capture** - Don't slow down walks
2. **Offline support** - Works without cell service
3. **Accurate AI** - Identifies rocks correctly
4. **Large text** - Readable for seniors
5. **Simple UI** - No confusion

### Should Have (P1)

6. **Batch operations** - Analyze/delete multiple
7. **Session tracking** - Group by walk
8. **Location names** - "Duluth" not coordinates
9. **Notes** - Add personal context
10. **Favorites** - Mark special finds

### Nice to Have (P2)

11. **Insights** - Patterns over time
12. **Export** - Share collection
13. **Map view** - See where finds are
14. **Multiple photos** - Different angles
15. **Cloud sync** - Access on multiple devices

---

## User Quotes (Real Feedback)

> "I love that I can just take a picture and keep walking. I don't have to stop and type anything."
> — Carol, on capture flow

> "The AI is surprisingly good! It identified my Lake Superior agate correctly."
> — Jim, on AI accuracy

> "The text is big enough that I can actually read it without my glasses."
> — Carol, on accessibility

> "I wish I could see all my finds on a map to remember where I found them."
> — Jim, on future features

---

## Anti-Patterns (What to Avoid)

### ❌ Complex Onboarding

- No multi-step tutorials
- No account creation
- App should work immediately

### ❌ Tiny Text

- Minimum 16px for body text
- 24px+ for titles
- High contrast colors

### ❌ Hidden Features

- Important actions should be obvious
- No hamburger menus hiding key functions
- Clear labels, not just icons

### ❌ Slow Operations

- No blocking UI during AI processing
- Background operations with progress
- Optimistic updates

### ❌ Technical Jargon

- "Analyze" not "Process with ML model"
- "Your Finds" not "Collection Database"
- "Location" not "GPS Coordinates"

---

## Success Metrics

### Engagement

- Daily active users (Carol & Jim use it every walk)
- Finds per session (average 10-15)
- Session completion rate (>90%)

### Satisfaction

- AI accuracy (>80% confidence on common rocks)
- Time to capture (< 5 seconds)
- User retention (daily use for months)

### Quality

- Crash rate (< 1%)
- Offline reliability (100%)
- Battery usage (< 5% per walk)

---

## Future User Stories

### Planned

- **Share Collection**: "I want to share my collection with my daughter"
- **Print Catalog**: "I want a printed book of my finds"
- **Learn More**: "I want to learn about rock formation"

### Under Consideration

- **Community**: "I want to see what others found nearby"
- **Challenges**: "I want to find all agate types"
- **Expert Mode**: "I want to add scientific details"

---

## Summary

Ocal is designed for **senior rock collectors** who walk beaches daily. The app must be a **silent partner** - helpful but not intrusive, simple but not limiting, powerful but not complex.

**Core Principle**: If Carol and Jim can use it effortlessly on their beach walks, we've succeeded.
