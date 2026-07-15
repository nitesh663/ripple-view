# Repository & Module Layout

> **ℹ️ Info**
>
> **Source of Truth.** Canonical reference for **Repository & Module Layout** within the RippleView framework. Part of the **RippleView** documentation set.

> 

The canonical map of *where everything lives*. An AI agent should consult this before creating a file, to place it correctly and import in the right direction.

## Three repositories (Rule G19)

**``**

``****

**``**
****
``

**``**

****

| Repo | Owns | Contains |
| --- | --- | --- |
| rv | Framework team | All @rippleview/* packages (engine, CLI, dashboard, lint) as npm workspace packages. |
| RippleViewTests | QA | UI automation only — net-new Gherkin `.feature` files + step definitions expressed in YAML, parsed and executed by the rv framework (Cucumber-style). The real `@op/*` libraries have only unit tests; RippleView adds this UI automation layer here, not inside the libs. Also holds the publishable @RippleViewTests/<lib> base-test packages. |
| rippleview-examples | Framework team (demo) | Demo only: a few mirror libraries (mimicking the `@op/*` convention) + a few mirror Angular consumer apps, used to prove the gate end-to-end. Has its OWN separate Jenkins pipeline. Never a dependency of the framework. |

Keep them separate; do **not** merge into one monorepo. The boundary enforces ownership and the agnosticism rule.

## `rv` workspace layout

```text
rv/
  packages/
    core/            # @rippleview/core   — stateless engine (Rule G1). The heart.
      src/
        config/      # config load + validate (rippleview.workspace.yaml, app configs)
        scene/        # SceneProvider SPI + built-in providers
        visual/       # capture → anchor → multi-signal differ → verdict
        bdd/          # YAML/Gherkin parse + universal step library
        registry/     # RegistrySource (package.json-derived knowledge)
        gate/         # compatibility gate orchestration + scoring
        store/        # ResultStore, BaselineStore adapters (file → cloud)
        plugin/       # Plugin SPI loader (dynamic import)
        errors.ts     # RippleViewError hierarchy
        index.ts      # the ONLY public barrel
        internal/     # not exported
    cli/             # @rippleview/cli   — oclif commands; the CI contract (Rule G7)
    dashboard/       # @rippleview/dashboard — Fastify API + React/Vite SPA (read-only)
    lint/            # @rippleview/lint  — Layer-0 static rules
      src/angular/   # @rippleview/lint/angular rule pack
      src/react/     # @rippleview/lint/react rule pack
    plugin-*/        # @rippleview/plugin-<name> — optional providers/notifiers
  docker/            # multi-stage images, compose for the isolation unit
  package.json       # npm workspaces ("workspaces": ["packages/*"])
```

## `RippleViewTests` layout

```text
RippleViewTests/
  libraries/
    <lib>/                 # e.g. datagrid/ (covers @op/datagrid)
      contract.yaml        # Component Test Contract (bounds the coverage denominator)
      *.feature            # net-new Gherkin functional tests
      *.yaml               # YAML step definitions + linked functional binding + visual specs (run by rv)
      package.json         # @RippleViewTests/<lib>, versioned in per-library lockstep to the @op/<lib> it covers, including its generation-suffix channel (e.g. 14.2.15-ng17) (Rule G3/D4)
  apps/
    <app>/
      rippleview.config.yaml     # one per app (Rule G6)
  rippleview.workspace.yaml      # one workspace config
```

## Import-direction rules (never create a cycle)

```text
@rippleview/cli ──► @rippleview/core ◄── @rippleview/dashboard
                  ▲
                  │ (reads, never imports app code — Rule G1)
            rippleview.config.yaml / registry / baselines / @RippleViewTests/*
@rippleview/plugin-* ──► (implements @rippleview/core SPI interfaces only)
```

- `@rippleview/core` imports **nothing** from `cli`, `dashboard`, `plugin-*`, `RippleViewTests`, or `rippleview-examples`.

- `cli` and `dashboard` depend on `core`; not on each other.

- Plugins depend on `core` *type* interfaces only.

- `rippleview-examples` depends on published packages like any consumer would — never the reverse.

## Where new code goes (quick decision table)

``**

``

``****

``

``````

``

``******

``

``

| You are adding… | Put it in |
| --- | --- |
| A new universal Gherkin step | core/src/bdd/steps/ + document in Specifications & Schemas |
| A new visual signal/differ | core/src/visual/signals/ |
| Support for a new UI framework | a new @rippleview/plugin-<framework> (Rule G11) — not in core |
| A new CLI command | cli/src/commands/ (oclif) |
| A new dashboard view/endpoint | dashboard/ (API under /src/api, UI under /src/ui) |
| A new Layer-0 rule | lint/src/<framework>/rules/ |
| A new result/collection field | the shared types in core/src/store/ and Result Documents & Consolidated Data Model |
| A base test for a library | RippleViewTests/libraries/<lib>/ (QA repo) |
| An app onboarding config | RippleViewTests/apps/<app>/rippleview.config.yaml |
