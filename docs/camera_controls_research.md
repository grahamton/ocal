# Camera Controls & Scale Research

**Date:** Jan 2026
**Context:** User feedback from Pixel 10 testing indicates frustration with default lens handling (unwanted switching) and a need for better framing (zoom) without physically moving. Scale estimation is also requested for scientific context.

## Goals

1.  **Refined Framing:** Allow users to frame the specimen tightly without physically crouching/moving excessively (Senior accessibility).
2.  **Lens Control:** prevent annoying "lens jumping" (wide <-> macro <-> normal) by giving the user explicit control or smarter defaults.
3.  **Scale Context:** Provide a way to record or estimate the size of the find ($1 coin, ruler, or pixel-based estimation).

## Current State

- Uses `expo-camera` defaults.
- No zoom control exposed in UI.
- No lens selection exposed (likely defaulting to 'wide-angle' or 'auto' depending on OS logic).
- No scale reference in UI.

## Options

### A. Zoom & Lens UI

1.  **Pinch-to-Zoom:**
    - _Pros:_ Standard gesture, minimal UI clutter.
    - _Cons:_ Hard to do one-handed (seniors often hold specimen in one hand, phone in other). Hard to discover.
2.  **Explicit Buttons (0.5x, 1x, 2x):**
    - _Pros:_ Accessible one-handed tap. Clear state. Prevents auto-switching jitter.
    - _Cons:_ Consumes screen real estate.
3.  **Slider:**
    - _Pros:_ Precise control.
    - _Cons:_ Fiddly for seniors. Hard one-handed.

**Recommendation:** **Option 2 (Buttons)**. Consistent with "Large Touch Targets" philosophy. A toggle row near the shutter button is standard/expected.

### B. Scale Estimation

1.  **Physical Reference Overlay:**
    - _Idea:_ Overlay a ghost image of a Quarter/Coin to guide user to place a real coin next to rock.
    - _Pros:_ Accurate.
    - _Cons:_ Requires user to have a coin handy.
2.  **AI Estimation:**
    - _Idea:_ Ask Gemini 2.0 to estimate size based on surroundings (sand grains, hand).
    - _Pros:_ friction-free.
    - _Cons:_ High error rate.
3.  **Virtual Ruler (AR):**
    - _Idea:_ Use AR measures/Depth API.
    - _Pros:_ Cool factor.
    - _Cons:_ High complexity, battery drain, requires movement to calibrate.

**Recommendation:** **Start with Option 2 (AI Guess)** but add metadata field for "Size Class" (Small/Med/Large) that user can tap-select in "Field Journal". Later, explore **Option 3 (AR)** if needed.

## Action Items

1.  **Docs:** Add `expo-camera` zoom prop investigation to backlog.
2.  **Prototype:** Add simple `[1x] [2x]` touchable opacity buttons to Capture Screen.
3.  **Schema:** Add `size_class` or `estimated_diameter_cm` to `AnalysisEvent` for AI to populate.
