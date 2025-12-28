# QA Checklist (Manual)

## Phase 1 — Capture
- Airplane mode: enable airplane mode, open app, Snap photo, verify “Saved offline” shows and item appears in Unsorted/Gallery.
- GPS fallback: with location off/blocked, Snap photo, verify save still succeeds with “no GPS” messaging.
- Cold start camera: force-quit app, reopen, time to camera ready; ensure Snap works on first try.
- Storage write: confirm photo is present in list/gallery and persists after app restart.

## Phase 2 — Sorting
- Offline edit: open an existing find, change label/note/category/status while offline, close modal, force-quit app, reopen and verify changes persisted.
- Filter chips: switch All/Draft/Cataloged and confirm items filter correctly.
- Gallery → detail: tap a tile to open detail, ensure edits save and return to list refreshes.

## AI (optional)
- Identify success: run Identify on a saved photo, confirm result appears and “Apply tags” fills label/category/notes.
- Identify failure: simulate by disconnecting network; confirm clear error message and app remains usable.
