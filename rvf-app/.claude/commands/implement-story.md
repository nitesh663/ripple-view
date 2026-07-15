---
description: Implement one RippleView story end-to-end (Jira → plan → code → tests → self-review → PR) for human review.
argument-hint: <JIRA-KEY>  (e.g. PROJ-1234; omit and you'll be asked which story)
---

Run the **implement-story** skill: [`docs/ai/skills/implement-story.md`](../../docs/ai/skills/implement-story.md).

Target story: **$ARGUMENTS** (if empty, ask which Jira story to implement).

Use the `rv-implementer` subagent. Fetch the Jira issue via the Jira MCP (`jira_getIssue`), then follow every step in the skill and the workflow; obey the Golden Rules in [`AGENTS.md`](../../AGENTS.md). Present your plan before coding. End at a PR using `.github/pull_request_template.md` that links the Jira key. **Never merge — this is for human review (G4).**
