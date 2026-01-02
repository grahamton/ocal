---
description: The Ultimate App/Code/Vibe Scrutinizer. Runs deep checks on technical health, aesthetic consistency, and "Silent Partner" alignment.
---

# 🕵️‍♀️ Ocal Scrutinizer (The Rut Breaker)

This workflow is your **Technical Muse**.
Its goal is to spot when you are coding yourself into a corner ("The Rut") and pull you out with fresh perspectives and modern patterns you might not know.

**Constraint: NO CODING.**
Do not write implementation code. Focus on _concepts_, _patterns_, and _architecture_.

## 1. Rut Detection (The Diagnosis)

Analyze the current code/approach for "Stale Thinking":

- **Brute Force:** Are we writing 50 lines of `useEffect` glue where a simple custom hook or library (like `TanStack Query`) would work?
- **Prop Drilling:** Are we passing data down 4 levels instead of using Composition or Context?
- **Legacy Patterns:** Are we using patterns from 2022 that have been superseded (e.g., manual fetches vs Suspense/actions)?
- **Over-Engineering:** Are we building a generic abstraction for a problem we only have once?

## 2. The Knowledge Drop (Best Practices)

Teach me something. Propose a specific technical concept or library that solves this elegantly:

- _Example:_ "Did you know you can use `useOptimistic` here instead of manual state management?"
- _Example:_ "This `ScrollView` performance issue is better solved with `FlashList` recycling."
- _Example:_ "A `State Machine` (XState) would handle this complex transition better than these 5 booleans."

## 3. Multiverse Analysis (The Alternatives)

Propose 3 distinct pathways forward to break the mental block:

### Path A: The "Modern Standard"

- How would a Senior Engineer at Meta/Vercel write this today?
- What are the bleeding-edge React Native/Expo best practices for this?

### Path B: The "Radical Simplification"

- If we deleted 50% of this feature, would it be better?
- How do we achieve the goal with _less_ UI?

### Path C: The "Vibe First" Approach

- Forget the logic. How do we make this _feel_ incredible?
- Shift focus from "correctness" to "delight" (Motion, Haptics, Sound).

## 4. The Report

Output a markdown summary:

- **Rut Status**: (Deep Rut / Wandering / On Track)
- **The "Did You Know?"**: Your educational tidbit.
- **The Way Out**: A recommendation on which Path (A, B, or C) to take.
