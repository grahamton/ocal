# Ocal: design handoff (elder-friendly UI review)

## Who it's for
Ocal is a rock-identification app for **one 74-year-old beachcomber on the Oregon coast** (the owner's dad), plus a few friends. He uses a Samsung phone, likely with **large system text**. He photographs a rock; "Ranger Al", a friendly retired-geologist persona running on Claude, tells him what it might be and chats about it.

**Every decision must be elder-friendly.** If a choice is between "clean" and "obvious", pick obvious.

## Elder-friendly bar (non-negotiable)
- Body text ≥ 18px, nothing below 16px. Layouts must hold up at **1.5× and 2× system font size**.
- Touch targets ≥ 56×56 dp, with generous spacing between targets. No tiny icon-only buttons.
- Contrast WCAG AAA (7:1) for text. Never rely on color alone.
- Plain words, no jargon ("My Rocks", not "Gallery"; "Take photo", not "Capture").
- No hidden gestures (long-press, swipe-only). Every gesture needs a visible button too.
- One obvious main action per screen, and visible state (saving, waiting for signal, Al is thinking).
- Destructive actions are separate, labeled, and confirmed. Auto-save everything; no "Save" to forget.
- Works outdoors: bright sun, cold or wet fingers, no signal.

## Screens and files
| Screen | Files |
|---|---|
| Take Photo (camera) | `app/app/(tabs)/index.tsx`, `app/src/features/capture/CameraCapture.tsx` + `.styles.ts` |
| My Rocks (gallery) | `app/app/(tabs)/gallery.tsx`, `app/src/features/gallery/*` |
| Rock detail | `app/src/features/detail/FindDetailModal.tsx`, `components/` (DetailHeader, RockCardView, AskAlChat, FieldNotesSection, PhotoViewer) |
| Header + walk pill | `app/src/shared/components/MainHeader.tsx`, `SessionControlModal.tsx` |
| Tabs / status bar | `app/app/(tabs)/_layout.tsx`, `app/app/_layout.tsx` |
| Settings | `app/app/settings.tsx`, `app/src/features/settings/DataManager.tsx` |
| Theme | `app/src/shared/theme.ts`, `ThemeContext.tsx` (Journal light, plus High-Contrast) |

## Already done (Nov 23 pass)
These were checked on a Pixel at 1.5× font. Before/after shots are in `docs/screenshots/2026-11-23-ui-pass/`.
- Full-size 3:4 viewfinder with a large shutter below it and a "Take photo" label.
- Detail page:
  - The photo scrolls with the page; tapping it opens a full-screen viewer with pinch/drag/double-tap zoom and big − / Whole photo / + buttons.
  - Fixed "‹ My Rocks" back bar.
  - Large "Add to favorites" button.
  - Labeled Share / Delete buttons; Delete is confirmed.
  - Notes auto-save.
- Visible status bar, taller tab bar, high-contrast walk pill, 3-line names on tiles.

## Please review (open issues)
1. **Settings screen:** not reviewed at all.
2. **"Walks" (sessions):** the pill, "By Walk" filter and sliders icon may be jargon. Should walks be invisible, just grouped by day?
3. **Gallery header:** "My Rocks" and "Your Finds (5)" repeat each other. The grid/list toggle and filter chips are small. The logo icon at top left means nothing.
4. **Ask Ranger Al chat:** Al's starter questions look like messages. Should they be tappable answer buttons? The keyboard and input behavior is untested.
5. **Waiting/failed states** on gallery tiles and the detail card ("Al is looking…", "Waiting for signal").
6. **High-Contrast theme:** untested since the redesign. Should it be the default outdoors?
7. **Rock card hierarchy:** the order and density of badges, story, "Try this", clues and "Could also be" for a first-time older reader.

## Constraints
- React Native (Expo SDK 52, Expo Router). **StyleSheet only, no Tailwind.** Imports use `@/`. Keep files under 200 lines.
- Don't change AI behavior or the card fields in the app. Ranger Al's voice and card schema live in `worker/src/prompt.ts` and `worker/src/card.ts`; propose copy changes there.
- Offline-first: capture and browsing must work with no signal.

## Deliverable
A prioritized list of changes, each with a screenshot or mockup and the file(s) it touches, ranked by impact for a 74-year-old user. Quick wins can go straight in as code. Verify at 1.5× font on a real device or emulator.
