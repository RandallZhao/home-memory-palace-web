# HOME ATLAS contribution guardrails

- Preserve the existing engine, DOM mount points, data model, map geometry, scene hierarchy, movement paths, keyboard controls, scoring, time, needs, speech and save behavior.
- Treat `docs/specs/` as immutable history. Add new requirements under `docs/patches/`; do not overwrite older specifications.
- Keep visual work incremental and scoped. Do not replace source assets or reorganize the project without explicit user approval.
- Before every commit, inspect the diff, run the relevant unit and browser regressions, and retain fixed-view before/after screenshots.
- Work on a feature branch. Do not push, merge, delete branches, rewrite history or remove archives without user authorization.
- Practice mode must never reveal the target word in labels, the minimap, hover text, accessible text or debug-facing UI.
