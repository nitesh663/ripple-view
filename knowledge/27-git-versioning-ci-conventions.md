# Git, Versioning & CI Conventions

> **ℹ️ Info**
>
> **Source of Truth.** Canonical reference for **Git, Versioning & CI Conventions** within the RippleView framework. Part of the **RippleView** documentation set.

> 

Source-control, versioning, and CI conventions. The big one is **base-test lockstep versioning** (Rule G3) — get it wrong and the gate loads the wrong tests.

## Commits — Conventional Commits

```text
<type>(<scope>): <imperative summary>

[body: why, not what]
[BREAKING CHANGE: ...]
```

- **types:** `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `build`, `ci`, `perf`.

- **scope:** the package or area — `core`, `cli`, `dashboard`, `lint`, `visual`, `gate`, `registry`, `store`, `plugin-storybook`, or a component name.

- `feat`/`fix` map to minor/patch; `BREAKING CHANGE` (or `!`) maps to major.

- Subject ≤ 72 chars, imperative ("add", not "added").

## Branching & PRs

``

``````

``

|  | Convention |
| --- | --- |
| Default branch | main (always releasable, always green through RippleView's own gate — G20) |
| Branch names | feat/<scope>-<short>, fix/<scope>-<short>, chore/<...> |
| PR size | Small, single-purpose; map to one user story/task where possible |
| Merge | Squash; PR title is a Conventional Commit |
| Required checks | lint · typecheck · unit · rv gate on examples · api-extractor diff |

### PR checklist (Definition of Done)

- [ ] Obeys all applicable **Golden Rules** (Part VIII overview).

- [ ] Lint + types + unit green; coverage ratchet not lowered (≥80% touched).

- [ ] Public API change? api-extractor report reviewed + correct semver bump.

- [ ] New behaviour has tests; determinism controls in place for any browser test.

- [ ] Docs updated if a contract, schema, or rule changed.

- [ ] No secrets, no PII in fixtures/screenshots; redaction respected.

## Semantic versioning

- All `@rippleview/*` packages follow **semver**. A breaking change to a published surface or an SPI interface is a **major** (Rule G16), gated by api-extractor.

- The `@op/*` libraries under test are versioned **independently per library**, each with **generation-suffix channels** — `-ng17`/`-ng15` (Angular generation), `-ag27`/`-ag30` (ag-grid line), prerelease `-beta17.x`. Version bumps and api-extractor diffs must be **channel-aware**: parse the suffix channel first, then compare majors/minors/patches *within* that channel — a `-ng17` version is never compared head-to-head with a `-ng15` one.

- Record version intent per PR via the **release tooling**; bumps and changelogs are produced per package. (For the real `@op/*` libraries today there is no Changesets pipeline — each library's version is bumped manually and published per-lib; the same per-library bump discipline applies.)

## Base-test lockstep versioning (Rule G3 — the critical one)

- `@RippleViewTests/<lib>` is a **publishable package whose version tracks the specific `@op/<lib>` version it tests** — including its generation-suffix channel (`-ng17`/`-ng15`/`-ag30`, etc.). This is **per-library lockstep**: each `@op/<lib>` has its own version line, and its base-test package follows *that* line, not one global "component version".

- **App pipeline** loads base tests at the app's *current* `@op/<lib>` version. **Gate** loads them at the *candidate* version of that same library. This is how the gate compares apples to apples — per library, per channel.

- Base-test version is **always derived** from the `@op/<lib>` version under test — never relative-imported, never hardcoded by an app. Because versioning is independent per library, the lockstep is resolved one `@op/<lib>` at a time.

- Storage: **Verdaccio / git tags** for PoC; private npm registry (**Nexus**, `@op:registry`) for prod (shape-compatible — G5).

```text
library @op/datagrid@4.3.0-ng17  ──published lockstep──►  @RippleViewTests/datagrid@4.3.0-ng17
gate testing candidate @op/datagrid@4.4.0-ng17  ──loads──►  @RippleViewTests/datagrid@4.4.0-ng17
```

## CI is just `rv` (Rule G7)

- Jenkins, GitHub Actions, GitLab, Bitbucket all do the same thing: call **`rv gate`**. No vendor logic in the engine.

- **CI-neutral outputs:** process **exit code** (0 pass / non-zero fail) + **JUnit XML** + **Allure** results + **`summary.json`**. Status surfaced via the pluggable `Notifier`.

- The gate stage order is fixed: ① static (Layer 0) → ② publish candidate → ③ impact select → ④ parallel fan-out → ⑤ aggregate (bug vs intentional) → ⑥ score → ⑦ report + gate decision.

- Everything heavy runs in Linux containers; the host only needs Node + the CLI (Rule G8).
