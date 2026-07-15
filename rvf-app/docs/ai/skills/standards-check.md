# Skill: standards-check

Audit the current diff (or a named PR) against the RippleView engineering standards. Claude Code exposes this as `/standards-check`. Advisory — a human still approves.

## Input

- A diff (default: the working-tree/branch diff) and, if available, the story's Jira key for AC context.

## Steps

1. Adopt the reviewer role ([`../agents/reviewer.md`](../agents/reviewer.md)).
2. Check the diff against the **Golden Rules (G1–G20)** and the conventions in [`AGENTS.md`](../../AGENTS.md) (§4).
3. For each acceptance criterion (if a Jira key is given), confirm a test proves it.
4. Confirm: no `any`/`@ts-ignore`/default exports in library packages; A11y-tree locators only; no hardcoded tokens / encapsulation piercing; findings-as-data; determinism controls present.

## Output

A ranked findings list — `severity · file:line · rule/AC · fix` — and a verdict (**approve / request-changes**), with the reminder that final sign-off is human.

## Use it

- Before opening a PR (self-review gate in `implement-story`).
- On an existing PR as a second pass.
