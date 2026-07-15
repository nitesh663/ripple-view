# AI Assist (Developer-Side)

> **ℹ️ Info**
>
> **Source of Truth.** Canonical reference for **AI Assist (Developer-Side)** within the RippleView framework. Part of the **RippleView** documentation set.

## 13. AI Assist (developer-side only)

****

****

| Agent | Trigger | Action | In CI? |
| --- | --- | --- | --- |
| Author Agent | Dev points it at an issue | Reads the story, drives the page via Playwright / Chrome-DevTools MCP, drafts YAML + feature tests + baselines for human review | No |
| Triage Agent | Red Jenkins gate | Reads the Allure trace + layer diff, explains the failure, proposes a fix or drafts an issue | No |

Jenkins runs only the deterministic engine. The framework is inspired by AI-driven MCP exploration, but the LLM never sits in the gate's hot path (determinism, cost, flakiness).

---
