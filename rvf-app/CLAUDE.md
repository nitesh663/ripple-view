# CLAUDE.md

**Claude Code adapter — the rules live in [`AGENTS.md`](AGENTS.md). Read it first, every session, and follow it exactly.** This file only adds Claude-Code-specific wiring; it does not restate the rules (single source of truth).

## Non-negotiable

- Obey the **Golden Rules (G1–G20)** in [`AGENTS.md`](AGENTS.md). If a task seems to need breaking one, stop and flag it.
- **You are advisory (G4):** never self-merge, never add an AI/LLM call into the gate/CI path. Open a PR for human review.
- The binding standards are the **Golden Rules (G1–G20)** and conventions in `AGENTS.md` — self-contained in this repo, nothing external to fetch.

## Claude Code features wired in this repo

- **Roles (subagents):**
  - `rv-implementer` — implements a story to standard, scoped to its tasks/AC.
  - `rv-reviewer` — reviews a diff against the Golden Rules + the story's acceptance criteria.
- **Workflows (slash commands):**
  - `/implement-story <JIRA-KEY>` — fetch the Jira issue (via the Jira MCP), plan, implement, self-review, open a PR.
  - `/standards-check` — audit the current diff against the engineering standards.

These are thin wrappers over the tool-agnostic definitions in [`docs/ai/agents/`](docs/ai/agents/) and [`docs/ai/skills/`](docs/ai/skills/) — keep behavior in those files, not here.

## Working agreement

- Implement the story you're given (by Jira key); stay in its scope, don't pull in sibling-story work.
- Match surrounding code; respect the package boundaries (keep `@rippleview/core` agnostic, G1).
- Every acceptance criterion gets a test; honour determinism (G13).
- Use Conventional Commits; branch `feat/<scope>-<short>`; never commit secrets.
