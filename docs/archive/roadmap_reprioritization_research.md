# Roadmap Re-prioritization Research

## Goals

Re-order the roadmap to prioritize database migration (Phase 8.1) before feature development (Phases 4-7). This ensures:

- **Solid foundation** before building advanced features
- **Performance improvements** for existing functionality
- **Data safety** through proper migration while datasets are small
- **Unlocks future features** that require efficient querying

## Current State

**Current Roadmap Order:**

1. Phase 4 - Poster (grid generation, requires efficient filtering)
2. Phase 5 - Session Enhancements (requires geospatial queries)
3. Phase 6 - UI Tooltips & Feedback
4. Phase 7 - iOS Version
5. Phase 8 - Database Enhancements (4 sub-phases)

**Problem:**

- AsyncStorage has no indexing or efficient querying
- Poster and Session Enhancements will be slow with large datasets
- Migration becomes riskier as user data grows
- Building features on weak foundation creates technical debt

## Options

### Option 1: Keep Current Order (Not Recommended)

**Pros:**

- Delivers user-facing features faster
- Postpones backend complexity

**Cons:**

- Features built on AsyncStorage will need refactoring later
- Performance issues will emerge as datasets grow
- Migration becomes harder with more data
- Technical debt compounds

### Option 2: Prioritize Full Database Enhancements (Phase 8.1-8.4)

**Pros:**

- Complete database solution upfront
- No future migration needed

**Cons:**

- 8-12 weeks of backend work before new features
- Cloud sync may not be needed yet
- Over-engineering for current needs

### Option 3: Prioritize Phase 8.1 Only (SQLite Migration) - **Recommended**

**Pros:**

- 2-3 weeks of focused backend work
- Unlocks efficient querying for Poster and Session features
- Preserves local-first philosophy (no cloud dependency)
- Easy to test with current tester datasets
- Provides data export for user peace of mind
- Foundation for future cloud sync (if needed)

**Cons:**

- Delays user-facing features by 2-3 weeks
- Requires thorough testing of data migration

## Recommendation: New Roadmap Order

### Immediate Priority (Next 2-3 weeks)

**Phase 8.1 - SQLite Migration & Export**

- Migrate AsyncStorage → SQLite
- Implement schema versioning
- Add data export (CSV/JSON/SQLite file)
- Build migration testing suite
- **No UI changes** - invisible to users

### Follow-up Priorities (After SQLite)

1. **Phase 4 - Poster** (now has efficient filtering)
2. **Phase 5 - Session Enhancements** (now has geospatial queries)
3. **Phase 6 - UI Tooltips & Feedback**
4. **Phase 7 - iOS Version**

### Future (User-Driven)

- **Phase 8.2** - Cloud Sync (only if users demand it)
- **Phase 8.3** - Advanced Data Tools
- **Phase 8.4** - Self-Hosting Option

## Rationale

### Why Now?

- **Testers are using new release** - perfect window for backend work
- **Small datasets** - easier to test migration, lower risk
- **Technical debt prevention** - avoid building on shaky foundation
- **Performance gains** - immediate benefit for existing features

### Why Phase 8.1 Only?

- **Local-first philosophy** - no forced cloud dependency
- **Minimal scope** - 2-3 weeks vs. 8-12 weeks
- **Unlocks features** - Poster and Session Enhancements need this
- **User control** - export gives users data ownership

### Why Before Poster/Sessions?

- **Poster requires efficient filtering** (date ranges, sessions, favorites)
- **Session Enhancements require geospatial queries** (finds within radius)
- **Both will be slow on AsyncStorage** with 100+ finds
- **Refactoring later is wasteful** - do it right the first time

## Action Items

1. **Update ROADMAP.md** - Move Phase 8.1 to immediate priority
2. **Create implementation plan** - Break down SQLite migration into tasks
3. **Notify testers** - Explain upcoming backend improvements
4. **Set timeline** - Target 2-3 weeks for Phase 8.1 completion

## Success Criteria

- [ ] All existing data migrates successfully
- [ ] No performance regression (ideally faster)
- [ ] Data export works (CSV, JSON, SQLite)
- [ ] Backward compatibility maintained
- [ ] Testers validate migration with real data
- [ ] Ready to build Poster with efficient queries
