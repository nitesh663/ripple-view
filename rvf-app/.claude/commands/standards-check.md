---
description: Audit the current diff (or a named PR) against the RippleView Golden Rules and engineering standards.
argument-hint: [PR-number or branch]  (optional; defaults to the working-tree diff)
---

Run the **standards-check** skill: [`docs/ai/skills/standards-check.md`](../../docs/ai/skills/standards-check.md).

Target: **$ARGUMENTS** (default: current working-tree / branch diff).

Use the `rv-reviewer` subagent. Return ranked findings (`severity · file:line · rule/AC · fix`) and a verdict. Advisory only — final approval is a human's.
