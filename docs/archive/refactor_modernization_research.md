# Technical Modernization & Polish Research

**Status**: Proposal
**Date**: Jan 1, 2026
**Context**: "Rut Check" analysis identified key areas where the codebase is "wandering" into technical debt.

## Goals

1.  **Eliminate "Glue Code"**: Remove manual state synchronization (event emitters, `refreshKey`, `useEffect` chains) that makes the code fragile.
2.  **Scale Performance**: Ensure the app stays 60fps even with 1,000+ finds (replacing `ScrollView` mapping).
3.  **Improve Maintainability**: Break down the "God Component" (`FindDetailModal`) into atomic, testable parts.
4.  **Elevate UX**: Move from "Database UI" (snapping updates) to "Fluid UI" (morphing/animations) to delight the specialized user base.

## Current State

- **State Management**: `SQLite` data is treated as client state. Components manually trigger refreshes via prop drilling (`refreshKey`) or global events (`DeviceEventEmitter`).
- **Lists**: `GalleryGrid` renders all items at once inside a `ScrollView`. This will crash or lag significantly as the collection grows.
- **Complexity**: `FindDetailModal.tsx` is nearly 900 lines long, handling UI, logic, AI polling, and state updates mixed together.
- **UX**: Functional but static. AI analysis results "snap" into place without transition.

## Options

### Option 1: The "Bandwidth" Approach (Status Quo)

Continue adding features using current patterns.

- **Pros**: No immediate refactor time.
- **Cons**: Technical debt accrues. Performance wall will be hit soon. "Spaghetti code" makes new features (Poster, Session Stats) harder to implement cleanly.

### Option 2: Full Rewrite

Rebuild the app from scratch using a new stack.

- **Pros**: Clean slate.
- **Cons**: Waste of time. The core business logic is sound; only the plumbing needs fixing.

### Option 3: Phased Modernization (Recommended)

Refactor in 3 targeted waves (Paths A, B, C).

- **Pros**: Incremental value. Solves specific "ruts" identified in analysis.
- **Cons**: Pauses feature development for 1-2 sprints.

## Recommendation: Phased Modernization

We will adopt **Option 3** with the following sub-phases:

### Path A: The "Modern Standard" (Infrastructure)

_Target: State & Performance_

1.  **TanStack Query**: Wrap SQLite calls in `useQuery`. Replace `refreshKey` props with `queryClient.invalidateQueries()`. This deletes ~20% of the glue code and fixes synchronization bugs forever.
2.  **FlashList**: Replace `ScrollView` + `.map()` in `GalleryGrid` with Shopify's `FlashList`. Instant 10x performance gain for large collections.

### Path B: The "Radical Simplification" (Architecture)

_Target: Maintainability_

1.  **Atomic Components**: Refactor `FindDetailModal` into `FindHero`, `AiAnalysisDock`, `RangerNotes`, and `FactGrid`.
2.  **Custom Hooks**: Extract AI polling and database logic into `useFindAnalysis(id)` and `useFindMutations()`.

### Path C: The "Vibe First" (Polish)

_Target: Delight_

1.  **Micro-animations**: Use `react-native-reanimated` / `moti`.
    - Morph "Rough" icon -> "Polished" category icon.
    - Spring animation for "Favorite" toggling.
    - Scanning light bar during AI loading.

## Action Items

1.  [ ] **Spike**: Create a proof-of-concept branch integrating `TanStack Query` with the existing `db.ts` methods.
2.  [ ] **Refactor**: Convert `GalleryGrid` to `FlashList`.
3.  [ ] **Refactor**: Split `FindDetailModal` into at least 3 sub-components.
