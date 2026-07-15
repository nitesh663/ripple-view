# AGENTS.md — rippleview-examples (demo apps & consumer onboarding)

> **Single source of truth for any AI coding tool** in this repo — Claude Code or any other. `CLAUDE.md` is a thin pointer here. Standards are **self-contained** in this file; story acceptance criteria come from **Jira** (`jira_getIssue`).

## 1. What this repo is

`rippleview-examples` holds **minimal demo consumer apps** (Angular + React) used to prove the engine, and serves as the **reference for onboarding a real consumer app** to RippleView. Two jobs here:
1. **Build/maintain the demo apps** that consume the shared library like a real app would.
2. **Show how a consumer app is onboarded** — its `rippleview.config.yaml`, auth/seed hooks, and how it must obey the Layer-0 standards.

You do **not** write framework code here (that's `rv`) or QA base tests (that's `rippleview-tests`).

## 2. The rules that matter most here

The Golden Rules are embedded in the `rv` repo's `AGENTS.md` (G1–G20). For app/consumer code, these dominate:

```
G15 Layer-0 bans: NO hardcoded design tokens (color/spacing/font/radius/z-index → semantic theme variables);
    no ::ng-deep, !important, ViewEncapsulation.None, global selectors, or inline styles. Encapsulation stays intact.
G2  Keep components A11y-correct: every interactive element has a role + accessible name (this is what locators rely on).
G6  App onboarding = ONE rippleview.config.yaml per app (not an array). `department` is a dashboard label only.
G9  The app is validated as a PRODUCTION build served by nginx — not a dev server. Make sure it builds for production.
G1  App specifics (auth, seed, baseUrl, theme) enter RippleView via config + hooks — never by changing the engine.
```

## 3. Standards

All onboarding standards are **self-contained in this file**. Story acceptance criteria and any linked design docs come from **Jira** — fetch via `jira_getIssue`. Key anchors:

- **App onboarding:** produce `apps/<app>/rippleview.config.yaml` (one config, G6) + `hooks/auth.ts`, `hooks/seed.ts`, `hooks/teardown.ts` (G1).
- **Layer-0:** no hardcoded tokens, no `::ng-deep`/`!important`/`ViewEncapsulation.None`/global selectors/inline styles (G15).
- **A11y:** every interactive element has a role + accessible name (G2).
- **Production build:** the app must build and serve as a production build, not a dev server (G9).

## 4. Onboarding shape (the thing you produce)

```yaml
# apps/<app>/rippleview.config.yaml  (or in the consumer repo)
app: checkout-web
department: payments            # dashboard label only
baseUrl: "http://app:8080"      # the served PRODUCTION build (G9)
hooks:
  auth: "./hooks/auth.ts"       # log in once; app-specific (G1)
  seed: "./hooks/seed.ts"       # API-first data setup
  teardown: "./hooks/teardown.ts"
matrix:                         # viewport × theme × locale (incl. RTL)
  viewports: [ ... ]
  themes: [ ... ]
  locales: [ ... ]
visual:
  sceneProvider: { module: "@rippleview/plugin-storybook", export: "createProvider" }  # or route-crawler/script
```

## 5. House rules

- Keep demo apps **minimal** but **production-buildable** (G9) and **Layer-0 clean** (G15) — they are the reference for "good".
- App specifics go in **config + hooks**, never in `@rippleview/core` (G1).
- Make components A11y-correct so role+name locators work (G2).
- Don't add hardcoded tokens or pierce encapsulation, even in a demo — these apps demonstrate the standard.

## 6. Workflow (any AI tool)

1. Read the story spec + the linked design docs.
2. Adopt the **app-onboarding** role.
3. Plan the config/hooks (or demo-app change); confirm Layer-0 compliance and a production build.
4. Implement; verify the app builds for production and passes Layer-0.
5. Self-review (Layer-0 clean? A11y roles/names? one config, not an array? hooks app-scoped?).
6. Open a PR (`.github/pull_request_template.md`) linking the **Jira key** + design docs. **Human-reviewed; never self-merge (G4).**

## 7. Per-tool wiring
- **Claude Code:** `CLAUDE.md`, the **app-onboarding** role, `/onboard-app`.
- Any other tool: adopt the **app-onboarding** role and follow this file. See [`docs/ai/README.md`](docs/ai/README.md).
