# Ocal: Agent Guidance (v2.0 - "The Magic Container")

## 1. Core Philosophy: "The Silent Partner"

Ocal is a field geologist's digital notebook for seniors (Carol & Jim). It is high-contrast, offline-first, and respectful of the user's time.

- **The "Magic Container" Rule:** We have removed the Inbox. Users capture finds, and they simply _appear_ in the Gallery. The sorting and identifying happens quietly in the background.
- **Curator, Not Teacher:** The AI should provide _context_ (age, formation, history), not _description_ (visual evidence the user can already see).
- **Safety First:** The AI must passively warn users about legal restrictions (e.g., National Parks) based on location.

---

## 2. The User Persona

- **Who:** Carol & Jim (65+), retired professionals living on the coast.
- **Physical Context:** Bright sunlight, cold hands, reading glasses often forgotten.
- **Mental Model:** "I want to snap a photo and keep walking. I'll look at the details when I have my coffee.".
- **Key Friction:** They hate "managing" data. Do not ask them to categorize, sort, or move files.

---

## 3. Architecture & Workflow (The "Truth")

_Reference Sources (Screenshots) and (Architecture)_

### A. Navigation Structure

- **Tabs:** Only **CAPTURE** and **GALLERY**. (The "Inbox" is dead).
- **Gallery Headers:** **"All"** and **"Favorites"**. (The "Review" tab is dead).

### B. The "Auto-Queue" Data Flow

1.  **Capture:** User taps "Save" in `CaptureScreen`.
2.  **Immediate Persistence:** Item is saved to SQLite (`finds` table) with `status: 'pending'`.
3.  **Visual Feedback:** The item appears immediately at the top of the `GalleryScreen` grid with the **"Rough" (Dashed)** icon.
4.  **Background Service:** `IdentifyQueueService` detects the pending item and initiates the API call to Gemini.
5.  **Optimistic UI:** The UI never blocks. The card updates live when the background service finishes.

---

## 4. The "Curator" AI Logic

_Reference Sources,,_

### A. System Prompt Strategy

**Goal:** Shift from "Visual Identification" to "Geologic Context."

- **Forbidden:** Do not list visual features (e.g., "fan-like shape," "red color") unless specifically debugging. The user has eyes.
- **Required:** Provide **Deep Context** based on Location + ID.

**Example Input:**

- _Image:_ Translucent orange stone.
- _Location:_ Waldport, OR.

**Example Output (The Curator):**

- **ID:** Carnelian Agate.
- **Age:** Miocene Epoch (~23 Million Years).
- **Formation:** Likely weathered from the **Astoria Formation** or **Columbia River Basalts** (Unit `uTvc`).
- **Context:** "These agates formed in gas cavities of ancient lava flows and were released as the host rock eroded into the sea.".

### B. Identification Rules (Knowledge Base)

Inject these rules into the RAG/Prompt context:

1.  **Agate vs. Jasper:** Agate is translucent (light passes through). Jasper is opaque (no light). If mixed, it is "Jaspagate".
2.  **Regional Specials:**
    - **Short Beach/Oceanside:** Known for **Green Jasper**.
    - **Big Sur (Jade Cove):** Nephrite Jade (Green, Blue, Vulcan). _Warning: Strict collection rules_.
    - **Puget Sound:** Petrified Wood (State Gem), often buried by volcanic ash.

---

## 5. Safety & Ethics Protocols

_Reference Sources,,_

The AI must act as a Ranger. If the GPS coordinates match these zones, inject a **warning badge** into the UI:

1.  **National Parks/Monuments:** "Collecting Prohibited".
2.  **Kiket Island (WA):** "Kukutali Preserve - Observation Only".
3.  **Jade Cove (CA):** "Strict Rules: Below mean high tide only. No lift bags. Hand tools only.".
4.  **Glass Beach (Fort Bragg):** "Collecting discouraged/prohibited" (Depleted resource).

---

## 6. The Visual Language (Status Icons)

_Reference Sources_

Never use text to indicate status. Use the **Dynamic Icon System**:

1.  **Rough (Pending):**
    - _Visual:_ Dashed Outline of a pebble.
    - _Meaning:_ "Saved to device. Waiting for AI."
2.  **Polishing (Processing):**
    - _Visual:_ Pulsing animation of the outline.
    - _Meaning:_ "The Curator is analyzing..."
3.  **Polished (Result):**
    - _Visual:_ Solid Shape.
      - **Circle/Oval:** Mineral/Agate/Jasper.
      - **Spiral:** Fossil (Ammonite/Shell).
      - **Triangle:** Artifact/Shard.

---

## 7. Tech Stack & Styling

- **Styling:** No Tailwind. Use React Native `StyleSheet` with `ThemeContext`.
- **Typography:** Large text. Minimum body size `16px`. Headers `24px+`.
- **Theme:**
  - **Capture:** High Contrast (Black/Neon).
  - **Gallery:** Journal (Paper/Teal/Glassmorphism).
- **State:** React Context (`SessionContext`). No Redux.

---

## 8. Current Implementation Priorities

1.  **Refactor Detail View:** Remove "Observable Evidence" list. Replace with "Geologic Context" chips (Age, Formation, Type).
2.  **Verify Queue:** Ensure `IdentifyQueueService` runs automatically upon `CaptureScreen` save.
3.  **Clean Nav:** Verify "Inbox" and "Review" tabs are completely removed from the router.
