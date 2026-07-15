# AI Enablement — architecture (Claude Code)

This repo is built to be implemented by **Claude Code** to a consistent standard, with a human-in-the-loop review gate. `AGENTS.md` is the single source of truth (rules + workflow); this folder holds the tool-agnostic *behavior* (roles + skills); `.claude/` is the thin Claude Code wiring that points here.

## One source of truth, thin wiring

```
AGENTS.md                       ← THE source of truth: Golden Rules, conventions, workflow. Read first, every session.
├─ CLAUDE.md                    ← Claude Code adapter → points to AGENTS.md + wires .claude/
docs/ai/                        ← behavior (no tool-specific syntax)
├─ implementation-workflow.md   ← the plan→code→test→review→PR loop
├─ agents/implementer.md        ← "Implementer" role (persona)
├─ agents/reviewer.md           ← "Reviewer" role (persona)
├─ skills/implement-story.md    ← command spec: Jira story → PR
└─ skills/standards-check.md    ← command spec: audit a diff
.claude/                        ← Claude Code wiring (thin; behavior lives in docs/ai/)
├─ agents/rv-implementer.md     ├─ agents/rv-reviewer.md
└─ commands/implement-story.md  └─ commands/standards-check.md
.github/pull_request_template.md ← human-in-the-loop review + traceability
```

**Rule:** never duplicate the standards into the wiring. `.claude/` and `CLAUDE.md` point to `AGENTS.md`; behavior lives in `docs/ai/`. The binding standards are the **Golden Rules (G1–G20)** and conventions in `AGENTS.md` — self-contained in this repo.

## How Claude Code uses it

| Surface | Reads | Roles / commands |
| --- | --- | --- |
| **Claude Code** | `CLAUDE.md`, `AGENTS.md`, `.claude/` | subagents `rv-implementer` / `rv-reviewer`; `/implement-story`, `/standards-check` |

The story to implement comes from **Jira**: `/implement-story <JIRA-KEY>` fetches the issue (summary, description, acceptance criteria, tasks, Definition of Done) through the Jira MCP, then plans, implements, self-reviews, and opens a PR.

## Human-in-the-loop guardrails

- AI is **advisory** (Golden Rule G4): it proposes changes and opens PRs; it **never self-merges** and **never runs inside the gate/CI**.
- Every PR uses `.github/pull_request_template.md` (AC→tests, Golden-Rule self-check, quality gate, human sign-off).
- Branch protection requires **human approval + green checks** before merge.

## Traceability

Every AI-assisted PR links its **Jira key** and any design doc the issue references, lists which standards applied, and names the agent used — so work traces cleanly from issue → design → PR.
