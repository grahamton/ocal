# Protocol: Ranger Al Prompt Tuning (15-Rock Dataset)

## Goal

Optimize `RangerConfig.ts` for persona consistency and scientific accuracy using a controlled dataset. Also discover which signals are worth showing to end users, and whether each should be default, context gated, user toggle, or hidden.

## Mode

Ensure app is in **Explore mode**.

## 1. Data Collection (The 15 Rocks)

- [ ] **Capture**: Photograph 15 distinct rocks using the app.
  - Include a mix of "keepers" and "leaverites" to test tumble logic.
  - Include at least 2 lookalikes (e.g., Red Basalt vs Jasper, or Dark Basalt vs Obsidian vs Sea Glass).
- [ ] **Queue**: Let Ranger Al process all 15 items.

## 2. Review and Harvest

For each rock, open "Scientist View" and scroll to **Raw Data Inspector**.

- [ ] **Copy Data**: Click `Copy JSON` and paste into `tuning_log.json` or notes.
- [ ] **Persona Check**: Does `ranger_summary` and `historical_fact` sound like Ranger Al? (Short sentences. No slang. No hype.)
- [ ] **Accuracy Check**: Look for common failure patterns (e.g. Red Basalt miscalled Jasper, Glass miscalled Obsidian).
- [ ] **Ghost Hunting**: List any new keys produced in explore output (`discovered_signals`).
- [ ] **Display Tagging**: For each new key/interesting field, label it as: `default`, `context`, `user toggle`, or `hidden`.

## 3. Analysis Table and Scoring

Track one row per rock.

| Rock ID | Real ID | AI Best Guess | Score | Issue Tags | Signals Worth Keeping |
| :------ | :------ | :------------ | :---- | :--------- | :-------------------- |
| 1       | ...     | ...           | 0.x   | ...        | ...                   |

### Scoring Rubric (Max 1.0)

- **Correctness (0.4)**: Is the ID scientifically defensible?
- **Persona (0.3)**: Does it sound like a ranger?
- **Usefulness (0.2)**: Is the advice/context managing expectations well?
- **Safety Clarity (0.1)**: Are warnings distinct from facts?

### Issue Tags

`misclassification`, `overconfidence`, `underconfidence`, `persona drift`, `unsafe advice placement`, `region mismatch`, `output structure break`

## 4. Tuning Loop

1. **Edit**: `src/ai/RangerConfig.ts`.
2. **Refine**: Change only **one** prompt block at a time:
   - Persona block
   - Geology heuristics block
   - Lapidary rules block
   - Output format block
   - Context usage block
3. **Reload**: `r` in terminal (or shake device) to reload bundle.
4. **Re-test**: Retry failures only, then spot check 2 non-failures to ensure no regressions.

### Tuning Rules

- **If too chatty**: Limit `ranger_summary` to 2-3 short sentences.
- **If hallucinating**: Add explicit negative heuristics tied to observed cues.
- **If unsafe**: Require safety to appear ONLY in `caution` or `red_flags`.
- **Ghost Field Promotion**: A field can be considered for Ship Schema only if:
  - It appears in at least 5 of 15 outputs.
  - It affects a user action OR a meaningful filter.
  - It is low risk if wrong.

## 5. Graduation (Ship Mode)

### Criteria

- [ ] 13 of 15 rocks correct.
- [ ] 0 cases where a high-confidence "leaverite" is called a "keeper".
- [ ] 0 safety content embedded in `historical_fact` or labels.
- [ ] Persona average meets your threshold.

### Steps

1. Lock the prompt.
2. Freeze Ship Schema v1.
3. Move only proven fields from Explore into Ship schema.
4. Turn `strict: true` and `additionalProperties: false` in Ship mode.
