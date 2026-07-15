# CLAUDE.md — rippleview-examples

**The rules live in [`AGENTS.md`](AGENTS.md). Read it first, every session.** This file only adds Claude-Code wiring.

## Non-negotiable
- Obey the Golden Rules — especially **G15** (no hardcoded tokens / no encapsulation piercing), **G2** (A11y roles + names), **G6** (one `rippleview.config.yaml` per app), **G9** (production build, not a dev server), **G1** (app specifics via config + hooks, never in core).
- **Advisory (G4):** propose changes for human review; never self-merge; never add AI into the gate.

## Wired here
- **Subagent**: `app-onboarding` — produces/updates an app's `rippleview.config.yaml` + hooks, or a Layer-0-clean demo-app change.
- **Command**: `/onboard-app <app|JIRA-KEY>` — fetch the Jira story via `jira_getIssue`, onboard or update an app to RippleView, then open a PR.

Behavior lives in [`docs/ai/`](docs/ai/) and `AGENTS.md`, not here.
