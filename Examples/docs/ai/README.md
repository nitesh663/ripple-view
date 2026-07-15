# AI Enablement — rippleview-examples (Claude Code)

`AGENTS.md` is the single source of truth (rules + workflow); `.claude/` is the thin Claude Code wiring. Any AI tool onboards apps to the same standard with a human review gate.

```
AGENTS.md                           ← THE source of truth (read first, every session)
├─ CLAUDE.md                        ← Claude Code adapter → wires .claude/
.claude/agents/app-onboarding.md    ← onboards an app or makes a demo-app change from a Jira story
.claude/commands/onboard-app.md     ← /onboard-app <app|JIRA-KEY>
.github/pull_request_template.md    ← Layer-0/A11y human sign-off + traceability
```

**Rule:** the wiring points to `AGENTS.md`; never duplicate the rules. The binding standards (Golden Rules for consumer apps) are self-contained in `AGENTS.md`. The story to implement against comes from **Jira**.

| Surface | Reads | Roles / commands |
|---|---|---|
| Claude Code | `CLAUDE.md`, `AGENTS.md`, `.claude/` | `app-onboarding`; `/onboard-app` |

AI is **advisory** (G4): it drafts config/hooks/demo-app changes for human review; it never self-merges and never runs inside the gate.
