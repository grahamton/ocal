---
description: How to capture app data for AI analysis and feedback
---

# Capture Test Data for AI Analysis

This workflow allows you to extract a lightweight JSON representation of your current app state (finds and sessions) to share with an AI assistant (like Gemini) for feedback, debugging, or validation.

## 1. Export Analysis Data

1.  Open the **Ocal App**.
2.  Tap the **Settings** (gear icon) in the top-right corner.
3.  Scroll down to the **Data Management** section.
4.  Tap **Export for Analysis**.
    - _Note: This generates a sanitized JSON file with large images removed to keep the file size small._
5.  Use the share sheet to:
    - **AirDrop** to your computer.
    - **Save to Files** on your device.
    - **Email** it to yourself.

## 2. Analyze with Gemini

1.  Go to [Gemini Advanced](https://gemini.google.com/).
2.  Upload the exported JSON file (`ocal_analysis_....json`).
3.  Paste a prompt like the one below to start the analysis:

```text
Here is the latest test data from my Ocal app.
Please analyze the finds and sessions.
- Are the AI identifications reasonable?
- Do you see any data inconsistencies?
- Suggest improvements for the next test run.
```

## 3. Iterating

- If you make changes in the app, simply run this export again to get a fresh snapshot.
- The JSON includes full details of the `aiData` structure, so you can debug prompt outputs and schema validation issues directly.
