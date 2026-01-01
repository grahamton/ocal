# Session Improvements Research

## Goals

**Problem**: Session capture is underutilized and poorly integrated:

- Session UI is hard to see (small pill in header)
- "Ranger Al" (AI identification) doesn't use session context at all
- Moving toward rich databases/collections requires better session metadata

**Opportunity**: Make sessions a first-class feature that enriches the entire experience.

## Current State

### Session Data Model

- **Schema**: `id`, `name`, `startTime`, `endTime`, `locationName`, `status`, `finds[]`
- **Workflow**:
  - Auto-creates sessions with time-based names ("Morning Walk (Dec 31)")
  - User can manually start/end/rename via `SessionControlModal`
  - Finds are auto-added to active session on capture

### UI Visibility

- **Header**: Small glass pill showing active session name
- **Modal**: `SessionControlModal` for editing (hidden behind tap)
- **Gallery**: No session filtering or grouping visible

### AI Integration

- **Current**: AI prompt (`rockIdPrompt.ts`) does NOT receive session context
- **Missed opportunity**: Location, time of day, and session notes could improve AI accuracy

## Options

### Option 1: Enhanced Session UI

**Goal**: Make sessions more visible and actionable

**Changes**:

- Add session filter chips to Gallery ("This Walk", "Last Week", etc.)
- Show session metadata in find detail view
- Larger, more prominent session indicator in header

**Pros**: Low-hanging fruit, improves discoverability
**Cons**: Doesn't solve AI integration

---

### Option 2: AI Context Enrichment

**Goal**: Pass session data to "Ranger Al" for better identification

**Changes**:

- Modify `rockIdPrompt.ts` to include:
  - Session location name (e.g., "Brighton Beach, Duluth")
  - Time of day (morning/afternoon/evening)
  - Session notes (if user adds context like "near pier")
- Update `identifyRock` function to accept session metadata

**Pros**: Directly improves AI accuracy, leverages existing data
**Cons**: Requires prompt engineering and testing

---

### Option 3: Session-First Workflow

**Goal**: Make sessions the primary organizing principle

**Changes**:

- Start with "New Walk" screen (location + notes)
- Gallery defaults to "Current Walk" view
- AI automatically uses session context
- Export/Poster features group by session

**Pros**: Cohesive, aligns with user mental model (one walk = one session)
**Cons**: Larger UX overhaul, requires rethinking navigation

## Recommendation

**Phased Approach**:

1. **Phase 1 (Quick Win)**: Option 2 - AI Context Enrichment

   - Modify AI prompt to include session location and time
   - Test if it improves identification accuracy
   - Low risk, high value

2. **Phase 2 (UI Polish)**: Option 1 - Enhanced Session UI

   - Add session filters to Gallery
   - Show session metadata in detail view
   - Improve header visibility

3. **Phase 3 (Future)**: Option 3 - Session-First Workflow
   - Only if user feedback shows sessions are valuable
   - Requires cloud sync to be truly useful (cross-device session access)

## Action Items

1. **Immediate**: Update `rockIdPrompt.ts` to accept optional session metadata
2. **Next**: Test AI accuracy improvement with session context
3. **Document**: Add session context to AI architecture docs
4. **Future**: Prototype session-first navigation (after cloud sync research)

## Related Work

- Desktop Access Research (`docs/desktop_access_research.md`) - Cloud sync would enable cross-device session access
- After the Gallery (`feature/after-the-gallery`) - Export/Poster features could group by session
