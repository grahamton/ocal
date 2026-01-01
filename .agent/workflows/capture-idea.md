---
description: Capture feature ideas without jumping into code
---

# Capture Idea Workflow

Use this workflow when you have a new feature idea, enhancement, or architectural change you want to explore.

## Steps

1. **Create a GitHub Issue (or local note)**

   - Title: Short, descriptive name (e.g., "Cloud Sync for Cross-Device Access")
   - Body: Describe the problem/opportunity and why it matters

2. **Create a Research Spike Branch**

   ```bash
   git checkout -b spike/[idea-name]
   ```

3. **Document the Idea**

   - Create `docs/[idea-name]_research.md` with:
     - **Goals**: What problem does this solve?
     - **Current State**: What exists today?
     - **Options**: List 2-3 approaches with pros/cons
     - **Recommendation**: Phased approach or preferred path
     - **Action Items**: Next concrete steps

4. **Update Roadmap**

   - Add to `ROADMAP.md` under "Backlog / Future Phases"
   - Include: Phase name, scope, link to research doc, status

5. **Update Architecture (if relevant)**

   - Add a section to `ARCHITECTURE.md` linking to your research doc
   - Example: "## Future: Cloud Sync - See `docs/cloud_sync_research.md`"

6. **Commit and Merge the Research**

   ```bash
   git add docs/[idea-name]_research.md ROADMAP.md ARCHITECTURE.md
   git commit -m "Add [idea] research spike"
   git checkout main
   git merge spike/[idea-name] --no-ff
   git push origin main
   git branch -d spike/[idea-name]
   ```

7. **Stop Here**
   - Do NOT write code yet
   - Do NOT create feature branches yet
   - The idea is now documented and safe in `main`

## When to Actually Build It

Only start a feature branch when:

- You've decided this is the next priority
- You have user feedback or a clear use case
- You're ready to commit to finishing it

Then:

```bash
git checkout -b feature/[idea-name]
# Now you can code
```

## Example

**Bad**: "Let's add cloud sync!" → immediately start coding → half-finished branch sits for months

**Good**: "Let's add cloud sync!" → create `docs/cloud_sync_research.md` → update roadmap → merge to main → wait until it's actually needed → then build it
