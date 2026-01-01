# Research: Find Pattern Memory

## Goals

The "Find Pattern Memory" feature aims to turn the application from a simple logging tool into an intelligent companion that understands the user's collecting habits and provides timely suggestions.

Primary objectives:

- **Correlate Finds with Conditions**: Link specific types of finds (Agates, Sea Glass, Fossils) with environmental factors (Beach, Tide, Recent Weather).
- **Predictive Suggestions**: Offer real-time advice on what to look for when the user starts a session at a specific location or under certain conditions.
- **Personalized Experience**: Learn from the user's history rather than relying on generic beachcombing data.

## Current State

- **FindRecord**: Currently tracks `lat`, `long`, `timestamp`, `category`, and `label`. It lacks explicit environmental data.
- **Session**: Tracks `locationName`, `startTime`, and `endTime`.
- **Database**: SQLite handles local storage. AI identification data is stored as JSON in `FindRecord`.

## Options

### Approach 1: Simple Frequency-Based Analysis (Local)

- **Mechanism**: Group finds by `locationName` and `category`. Calculate the most common finds per beach.
- **Pros**: Easy to implement locally; no external APIs needed; works offline.
- **Cons**: Ignores weather/tides, which are critical for beachcombing.

### Approach 2: Condition-Aware Pattern Detection (Recommended)

- **Mechanism**:
  1.  **Expand Session Schema**: Add fields for `tide` (ebbing, flowing, low, high), `weather` (sunny, rainy, post-storm), and `swell`.
  2.  **Enrich Data**: When a session starts, prompt the user for these conditions or fetch them from a weather/tide API.
  3.  **Pattern Extraction**: Run a background task to identify correlations (e.g., "70% of your Jasper finds at 'Rialto Beach' occur at Low Tide after a Storm").
  4.  **UI Feedback**: Display a "Watch for Agates today!" card when starting a session.
- **Pros**: Highly accurate and useful recommendations.
- **Cons**: Requires schema changes and potentially API integrations.

### Approach 3: LLM-Driven Insights

- **Mechanism**: Send the user's find history and current conditions to an LLM (Gemini) to generate natural language suggestions.
- **Pros**: Can detect subtle patterns and provide rich, conversational advice.
- **Cons**: Requires internet; higher latency; token costs.

## Recommendation: Phased Approach

We should start with **Approach 2 (Condition-Aware)** but keep it manual first to avoid API complexity.

1.  **Phase 1: Session Enrichment**: Allow users to tag sessions with "Stormy", "Low Tide", etc.
2.  **Phase 2: Local Correlation**: Build a small service that parses past sessions and finds to find commonalities.
3.  **Phase 3: Insights UI**: Add a "Today's Focus" section to the active session view.

## Action Items

1.  [/] Create research spike branch (Completed)
2.  [ ] Draft schema updates for `Session` and `FindRecord`.
3.  [ ] Design "Session Condition" tagger UI.
4.  [ ] Prototype the pattern detection logic.
