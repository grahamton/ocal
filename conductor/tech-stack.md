# Ocal Tech Stack (Nov 2026)

Ocal is a phone app for one senior beachcomber and a few friends. The stack is
deliberately small: everything lives on the phone except one AI call.

| Category | Technology | Notes |
|---|---|---|
| App | React Native + Expo SDK 52, Expo Router | Android first (sideloaded APK). `app/` |
| Data | SQLite on device (`expo-sqlite`) | `app/src/shared/localDb.ts`, DB `ocal_v2.db`. Finds + sessions stored as JSON rows. |
| Photos | Device storage (`expo-file-system`) | Copied to `documentDirectory/images/`. Nothing uploaded except for identification. |
| AI | Claude Sonnet 5.5 via the Anthropic SDK | Called only from the Worker. Structured output for the rock card, free text for chat. |
| Backend | Cloudflare Worker | `worker/`: `POST /identify`, `POST /chat`. Owns Ranger Al's prompt and the geology KB (prompt-cached). |
| Auth | Shared access code (`X-Ocal-Key`) | Plus Workers rate limiting. Anthropic key is a Worker secret, never in the app. |
| Gestures | react-native-gesture-handler + reanimated | Photo zoom viewer. |
| Build | Local Gradle / EAS | `npx expo prebuild` + `gradlew assembleDebug` for dev builds. |

## How a find flows
1. **Take photo:** saved to device storage and SQLite as a `draft`. This works offline.
2. **Identify queue** (`app/src/ai/IdentifyQueueService.tsx`):
   - It picks up drafts, resizes the photo to 1280px, and POSTs it to the Worker.
   - With no signal, the find stays a draft. It retries on app foreground, when the network returns, and every 3 minutes.
3. **Worker:** sends the photo, location and note to Claude, and validates the card.
4. **Detail view:** shows the rock card. **Ask Ranger Al** chat goes through `/chat`, and history is saved with the find.

## Not used anymore
Firebase (Auth, Firestore, Storage, Functions), Gemini, LiteLLM, PostHog and Zustand.
Old code in `server/`, `mcp/` and `src/` is untracked. Old docs are in `docs/archive/`.

## Possible next steps
- **Shared collection** between dad and son: Cloudflare D1 for data and R2 for photos.
- **Haiku vs Sonnet** eval on real photos (TypeSafe idea).
- **Upgrade Expo SDK**, which fixes the Android 16 KB page-size warning.
