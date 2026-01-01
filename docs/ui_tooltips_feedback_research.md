# UI Tooltips and Feedback Research

## Goals

**Problem**: Users need help understanding the app and a way to communicate with the developer:

- First-time users don't know what features exist or how to use them
- No easy way for users (Carol & Jim) to send feedback or report issues
- "Silent Partner" philosophy means UI should be self-explanatory, but some hints would help

**Opportunity**: Add contextual help and a feedback channel without cluttering the UI.

## Current State

### Onboarding

- **None**: App opens directly to Capture screen
- **Assumption**: Users figure it out by exploring
- **Risk**: Features like Sessions, AI, Insights may go undiscovered

### Feedback Channel

- **None**: Users must email or text the developer manually
- **Friction**: Requires leaving the app, finding contact info

## Options

### Option 1: Tooltips on First Launch

**Goal**: Show brief hints on first use

**Approach**:

- Use `AsyncStorage` to track "first launch"
- Show dismissible tooltips pointing to key features:
  - "Tap here to start a session"
  - "Swipe to see AI analysis"
  - "Long-press to select multiple"
- Auto-dismiss after user interacts

**Pros**: Low friction, contextual, respects "Silent Partner" philosophy
**Cons**: Requires careful design to avoid feeling like a tutorial

---

### Option 2: Help Button + Modal

**Goal**: On-demand help accessible anytime

**Approach**:

- Add "?" icon to header
- Modal with:
  - Feature overview
  - Tips & tricks
  - Link to feedback form

**Pros**: Always available, doesn't interrupt first use
**Cons**: Users must discover and tap it

---

### Option 3: In-App Feedback Form

**Goal**: One-tap feedback submission

**Approach**:

- Add "Send Feedback" button (Settings or header)
- Simple form:
  - Message text area
  - Optional screenshot attachment
  - Auto-include app version, device info
- Submit via email (using `expo-mail-composer`) or HTTP POST to simple backend

**Pros**: Removes friction, captures context automatically
**Cons**: Requires email setup or backend endpoint

---

### Option 4: Combined Approach

**Goal**: Best of all worlds

**Approach**:

- **First launch**: Show 3-4 key tooltips
- **Help button**: Always accessible for reference
- **Feedback**: Dedicated "Send Feedback" in Settings

**Pros**: Covers all use cases
**Cons**: Most work, but highest value

## Recommendation

**Phased Approach**:

1. **Phase 1 (Quick Win)**: In-App Feedback

   - Add "Send Feedback" button using `expo-mail-composer`
   - Pre-fill with app version and device info
   - Lowest effort, immediate value

2. **Phase 2 (Onboarding)**: First-Launch Tooltips

   - Identify 3-4 critical features to highlight
   - Use simple overlay tooltips (or toast-style hints)
   - Track dismissal in `AsyncStorage`

3. **Phase 3 (Optional)**: Help Modal
   - Only if users request more comprehensive help
   - Could be a simple markdown viewer

## Action Items

1. **Immediate**: Research React Native tooltip libraries (`react-native-walkthrough-tooltip`, `react-native-popover`)
2. **Next**: Design feedback form UI (keep it minimal—one text field + send button)
3. **Test**: Validate `expo-mail-composer` works on target devices
4. **Future**: Consider analytics to see which features are underused (guides tooltip placement)

## Related Work

- Session Improvements (`docs/session_improvements_research.md`) - Better session UI reduces need for tooltips
- Silent Partner UX - Tooltips must be non-intrusive and dismissible
