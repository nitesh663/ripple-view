# Skill: implement-story

Drive one RippleView story from its Jira key to a human-reviewable PR. Claude Code exposes this as `/implement-story`.

## Input

- `JIRA-KEY` (e.g. `PROJ-1234`). If omitted, ask which story to implement.

## Steps

1. **Fetch** the Jira issue through the Jira MCP (`jira_getIssue`): summary, description with AC/tasks/DoD, story points. Open any design doc linked in its _Reference_ section.
2. **Adopt the implementer role** ([`../agents/implementer.md`](../agents/implementer.md)).
3. **Plan and present** before coding: files to change, task→AC→test mapping, applicable Golden Rules. Pause for human steer if the AC is ambiguous.
4. **Implement** per [`../implementation-workflow.md`](../implementation-workflow.md), staying in scope.
5. **Add a test per AC**; ensure determinism (G13); run lint + types + unit locally until green.
6. **Self-review** via the `standards-check` skill / reviewer role; fix findings.
7. **Open a PR** (branch `feat/<scope>-<short>`, Conventional Commit title) using `.github/pull_request_template.md`, linking the Jira key + any design doc. **Do not merge** (G4).

## Output

A focused PR awaiting human approval, with: in-scope changes, a test per AC, green lint/types/unit, and the Jira backlink.

## Guardrails

- Never merge; never add AI into the gate (G4).
- Never break a Golden Rule to "make it work" — stop and ask.
- Never change a public API surface (G16) or a result-document shape (G5) without flagging it for human decision.
