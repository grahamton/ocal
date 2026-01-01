# Ocal: Agent Guidance (v1.0 Beta)

**Core Philosophy: "The Silent Partner"**
Ocal is a tool for senior beachcombers. It is high-contrast, offline-first, and respectful of the user's time. We are NOT building a social network or a gamified toy. We are building a field geologist's digital notebook.

## 1. The User (Persona)

- **Demographic**: Seniors (65+), retired professionals.
- **Context**: Walking on a sunny beach, often without glasses, sometimes with dirty hands.
- **Needs**: Large text, clear icons, ZERO login friction, works offline.

## 2. Technical Stack (The "Shell")

- **Framework**: React Native (Expo).
- **Language**: TypeScript (Strict).
- **Styling**: `StyleSheet` (No Tailwind/StyledComponents). Use `ThemeContext` for dynamic theming.
- **Data**: `expo-sqlite` (Local First). No cloud database for user data yet.
- **AI**: Firebase Cloud Functions + Google Gemini (for visual ID).

## 3. Key Systems (The "Heart")

### A. StatusIcon ("The Visual Language")

- **Rough**: Dashed icon (Pending).
- **Polishing**: Pulsing animation (Processing).
- **Polished**: Solid Shape (Result).
- **Rule**: Never show text status (e.g., "Processing...") without the accompanying icon. The icon _is_ the status.

### B. Themes ("Beach vs. Journal")

- **High-Contrast (`mode === 'high-contrast'`)**:
  - Used in the field (Capture).
  - Black background, White text (#FFF), Neon accents.
  - No gradients, no blurs.
  - Max readability.
- **Journal (`mode === 'journal'`)**:
  - Used at home (Detail/Reflect).
  - Paper/Teal tones, Glassmorphism covers.
  - Rich details.
  - Comfortable reading.

## 4. Development Rules

1.  **Repo Structure**:
    - `/app`: The Expo project.
    - `/functions`: The Backend (AI).
2.  **No Auth**: Do not add login screens.
3.  **No Inbox**: The flow is Capture -> Gallery. There is no intermediate "sorting" bin.
4.  **Icons**: Use `StatusIcon` for app-specific logic. Use `Ionicons` for generic UI actions.

## 5. Current Focus (Beta)

- Stability of the AI pipeline.
- Refining the "StatusIcon" animations.
- Gathering feedback on the "Beach Mode" visibility.
