# Agent Handoff: Ocal (Nov 23, 2026)

## Where things stand
- **Reboot done:** Firebase and Gemini removed. Local SQLite and local photos in the app; Claude on a Cloudflare Worker for AI.
- **Tested on a Pixel 10 Pro at 1.5× font:**
  - identify, chat, offline retry
  - zoomable photo viewer, 3:4 viewfinder
- **Worker deployed:** `https://ocal-ranger.rainbowfetch-cms-auth.workers.dev`, with secrets set.
- **Health:** `tsc` 0 errors, `npm run lint` clean in `app/`; `npm run typecheck` clean in `worker/`.
- **Not done:**
  - The app's `.env` still points at the local Worker.
  - The standalone APK for dad's Samsung isn't built.
  - `npm test` is broken (pre-existing).

## File map
| Area | Files |
|---|---|
| Worker (AI) | `worker/src/index.ts` (routes, auth, rate limit), `ranger.ts` (Claude calls, caching, usage log), `prompt.ts` (Ranger Al persona, the only copy), `card.ts` (rock card schema), `schemas.ts` (request validation) |
| App AI client | `app/src/ai/ranger.ts` (resize, POST, offline errors), `rockCard.ts` (types, confidence words), `IdentifyQueueService.tsx` (self-healing queue) |
| Data | `app/src/shared/localDb.ts` (SQLite; serialized read-modify-write), `storageService.ts` (photos) |
| Camera | `app/app/(tabs)/index.tsx`, `app/src/features/capture/CameraCapture.tsx` + `.styles.ts` |
| My Rocks | `app/app/(tabs)/gallery.tsx`, `app/src/features/gallery/` |
| Rock detail | `app/src/features/detail/FindDetailModal.tsx`, `components/` (DetailHeader, RockCardView, AskAlChat, FieldNotesSection, PhotoViewer) |

## Testing on a phone (wireless debugging)
1. Pair once with `adb pair <ip:port> <code>`, then `adb connect <ip:port>`.
   - `adb mdns services` shows the ports.
2. Forward ports so the phone reaches your PC:
   - `adb reverse tcp:8081 tcp:8081`
   - `adb reverse tcp:8787 tcp:8787`
3. Run `npm run dev` in `worker/` and `npx expo start --dev-client --localhost` in `app/`, then open the app.
4. Screenshots: `adb exec-out screencap -p > shot.png`. Before/after shots are in `docs/screenshots/`.

## Gotchas
- **Airplane mode** drops the Wi-Fi adb link and the port forwards. Re-run `adb connect` and `adb reverse` after.
- **New native modules** need a rebuild: `npx expo prebuild`, then `gradlew assembleDebug`.
- **Android 16 KB page-size warning** comes from Expo SDK 52's native libraries. Harmless for now; upgrading Expo fixes it.
- **Worker logs:** each Claude call logs a token/cache line (`[identify] in=… cache_read=…`). The 26k-token prompt plus KB should show `cache_read`.

## Next up
- **UI review:** see `docs/DESIGN_HANDOFF.md`.
- **APK for dad:** point `.env` at the live Worker, then build a release APK.
- **Optional:**
  - set identify to `low` effort for speed
  - Haiku vs Sonnet eval
  - shared collection (D1 + R2)
