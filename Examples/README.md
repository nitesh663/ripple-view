# rippleview-examples — demo apps & consumer onboarding

Minimal **Angular + React** demo consumer apps that prove the RippleView engine, plus the **reference for onboarding a real consumer app** (its `rippleview.config.yaml` + auth/seed hooks). These apps are also the "good citizen" reference: production-buildable and Layer-0 clean.

- **Design source of truth:** [RippleView hub]().
- **Work tracking:** RippleView backlog, component **UI Platform**.

## Start here
1. Read [`AGENTS.md`](AGENTS.md) — onboarding rules and workflow.
2. Onboard/edit with AI: Claude Code `/onboard-app <app|STORY-KEY>`. AI proposes; **a human reviews** (Golden Rule G4).

## Demo Fixture Suite

`react-app/` is the original minimal Sprint-0 scaffold (the Angular equivalent, `angular-app/`, was retired once the real Angular fixtures under `angular/` landed). A larger, **oracle-backed** fixture matrix is built out under a dedicated epic (**most of its stories are done**): shared component libraries maintained across parallel Angular generations (15/17) plus a deliberately minimal React 19 line, consumer apps scattered across those generations (including one deliberately neglected, never-gated "brownfield" app), and a machine-readable `fixtures.manifest.json` documenting the expected verdict for every (app × library × candidate version) combination. See [`docs/fixtures/ARCHITECTURE.md`](docs/fixtures/ARCHITECTURE.md) for the layout/naming convention and the signal-coverage matrix; run `npm run validate:fixtures` to check the committed oracle. The fixture libraries (`@op/core-controls`, `@op/data-grid`, `@op/shared`, `@op/react-core-controls`) are real, version-tagged packages published to a local **Verdaccio** registry — see [`docs/fixtures/VERDACCIO.md`](docs/fixtures/VERDACCIO.md) for what Verdaccio is, what's currently published, and how to reset it. Every fixture app has a real `rippleview.config.yaml`, and the repo root has an `rippleview.workspace.yaml` — see [`docs/fixtures/REGISTRY_DEMO.md`](docs/fixtures/REGISTRY_DEMO.md) for the registry-scan/impact-selection demo.

## Related repos
- **rv** — the framework. **rippleview-tests** — QA base tests.
Separate repositories (not submodules); they interact via published packages + the `rv` CLI.
