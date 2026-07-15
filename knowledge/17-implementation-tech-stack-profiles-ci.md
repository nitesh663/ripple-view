# Implementation: Tech Stack, Profiles & CI

> **ℹ️ Info**
>
> **Source of Truth.** Canonical reference for **Implementation: Tech Stack, Profiles & CI** within the RippleView framework. Part of the **RippleView** documentation set.

## 1. Concrete tech stack & feasibility

****

**``**

****

````

````

``

********

****

****

****``

********

****

****

****

| Concern | Choice | Why | Feasibility / evidence |
| --- | --- | --- | --- |
| Runtime / typing | Node.js 20 LTS + TypeScript (strict) — the framework's own greenfield toolchain (Vitest for rv's unit tests). Note: real `@op/*` consumer CI runs Node 16/18; the runner image isolates rv's Node from the consumer build. | Strong typing for schemas; async CDP I/O | Mature |
| Browser automation | Playwright Core | CDP, Shadow DOM piercing, A11y tree, multi-engine | Mature |
| Deterministic runtime (PoC) | mcr.microsoft.com/playwright Docker image | Browser binaries + OS libs + fonts pre-baked, Ubuntu LTS, pinned per release. Docker is the PoC isolation/determinism mechanism; the app-runtime image is built only for the example apps. Production deploy reality = AWS S3 static (`aos-static-ui-repository` → nginx/CDN, base-href). | Official, widely used in CI |
| BDD | Cucumber.js over YAML steps | Maps Gherkin → universal A11y steps | Mature |
| Visual diff | pixelmatch + sharp; YIQ threshold + AA-ignore | Lightweight SSIM; Chromatic-proven knobs | Mature |
| Geometry/style diff | custom over getBoundingClientRect / getComputedStyle | Deterministic, value-level findings | Standard browser APIs |
| A11y audit | axe-core | WCAG compliance | Mature |
| Static gate | Stylelint, PostCSS, ESLint, ts-morph, api-extractor | Tokens/encapsulation/API/a11y (Angular is the v1 target) | Mature |
| Ephemeral registry | Verdaccio (PoC default, in CI) + Nexus private registry (prod) — selected by a single `.npmrc`/config switch, no code change | Publish candidate, install into consumers | Used by angular-cli, CRA, Storybook |
| Version swap | npm `overrides` field in package.json, applied with `npm install --legacy-peer-deps` (matches the real `@op/*` consumer trees) + `.npmrc` | Force candidate transitively | Standard |
| Orchestration (MVP→prod) | docker-compose → Kubernetes Jobs | Per-app isolation unit | Standard |
| CI | Jenkins (Bitbucket Pipelines compatible) | Existing enterprise CI | Existing |
| Storage (MVP→prod) | JSON docs (Mongo-shaped) → MongoDB; baselines on S3/MinIO | Lift-and-shift later | Standard |
| Reporting | Allure + Prometheus/Grafana | Drill-down + platform SLOs | Mature |
| CLI | Node CLI (oclif/commander) | Single entry point for CI & devs | Mature |
| AI (dev-side) | Claude API + Playwright/Chrome-DevTools MCP | Author/Triage agents | Available; dev-side only |

**Feasibility verdict:** every load-bearing block is an established, battle-tested tool. The only *custom* engineering is (a) the multi-signal differ — built on deterministic browser APIs, feasible — and (b) the autonomous crawler/probes — the one higher-risk area, de-risked by the pluggable SceneProvider (see [RippleView_VISUAL_CRAWLER.md](RippleView_VISUAL_CRAWLER.md) §4, §13).

---

## 5. Cross-cutting modules — implementation scope (the diagram-2.2 explainer)

Each entry: **what it is · tech · how built · scope**.

### 5.1 Plugin SPI (`@rippleview/core` extension points)

- **What:** stable interfaces so teams extend without forking — the mechanism that makes RippleView reusable for any UI.

- **Tech:** TypeScript interfaces + a plugin registry; plugins are npm packages (keyword `rv-plugin`) loaded via config using dynamic `import()`. SPI is versioned; engine advertises a supported SPI range, plugins declare compatibility.

- **Extension points:** `SceneProvider`, `Validator` (differ), `LocatorStrategy`, `AuthProvider`, `SeedProvider`, `Reporter`, `RulePack` (static gate), `RegistryResolver`. *(The built-ins are themselves plugins — proves the SPI.)*

- **Scope:** define interfaces + loader + ship the built-ins through the SPI.

### 5.2 Security & Redaction

- **What:** stop PII leaking into forensic traces/baselines.

- **Tech:** Playwright screenshot **`mask`** option (built-in) for visual redaction; route interception to scrub network headers/bodies; DOM sanitization before serialize; config-driven selectors/regex.

- **How:** a redaction middleware sits in the Capturer + Result Writer; applied before any persistence.

- **Scope:** redaction config schema + middleware.

### 5.3 Secrets / Vault

- **What:** credentials & endpoints injected at runtime, never in repo (NFR-SEC-01).

- **Tech:** Vault / AWS Secrets Manager / CI secret bindings → environment → consumed by the `auth` hook and by `.npmrc` auth for the private registry.

- **Scope:** a `SecretsResolver` abstraction + CI secret wiring; optional vault-agent sidecar.

### 5.4 CLI (`@rippleview/cli`)

- **What:** the single entry point Jenkins and developers invoke.

- **Tech:** Node CLI (oclif/commander), thin over core + orchestrator.

- **Commands:** `rv run`, `rv gate`, `rv crawl`, `rv scan` (registry), `rv baseline accept|deny`, `rv report`, `rv init`, `rv gate --local`.

- **Scope:** command surface + config loading + exit-code semantics.

### 5.5 Governance / RBAC / Audit

- **What:** who may approve baselines / bless reverse-engineered tests / waive violations / override thresholds — with an immutable trail.

- **Tech:** dashboard backend with SSO/OIDC; role model; append-only audit log (JSON documents in MVP → DB later); approvals stamped with SSO identity + issue tracker.

- **Scope:** roles, audit collection, approval endpoints.

### 5.6 Notifications / SCM integration

- **What:** feedback in the developer workflow.

- **Tech:** SCM checks API (Bitbucket/GitHub) to block merges + inline PR comments; Slack/Teams incoming webhooks; issue-tracker REST for create/link.

- **Scope:** a `Notifier` invoked at gate end with templated, trace-linked messages.

### 5.7 Scaffolding (`rv init`)

- **What:** one-command onboarding across consumer teams.

- **Tech:** CLI generator with per-framework templates (Angular is the v1 target; React is a future extension point).

- **Output:** workspace/app config, hook stubs, a sample scene/test, a CI snippet.

- **Scope:** template set + generator.

### 5.8 Config & Tenant Resolver / Result Store (recap)

- Config: workspace + per-app YAML (§5.1 design). Result store: tenant-tagged Mongo-shaped JSON written to a volume → S3, ingested by the dashboard (path-isolated + tag-filtered).

---

## 7. Feasibility & evidence summary

````

| Area | Risk | Evidence the approach works |
| --- | --- | --- |
| Deterministic capture in Docker | Low | Official Playwright image, used across CI industry |
| Swap lib version & test consumers | Low | Verdaccio (PoC) / Nexus (prod) + npm `overrides` — pattern used by angular-cli, CRA, Storybook |
| Wait-for-app + collect output | Low | compose service_healthy + --exit-code-from; k8s probes |
| Parallel isolation at scale | Medium | k8s Jobs — standard CI pattern (infra effort) |
| Multi-signal differ | Medium | deterministic browser APIs + pixelmatch; custom but bounded |
| Autonomous crawler/probes | Medium-High | de-risked via SceneProvider phasing (VC-0→VC-3) |
| AI Author/Triage | Medium | MCP + Claude API; dev-side only, never gating |

---

## 8. Process stages — an implementer's checklist

1. **Stand up foundations:** `rv` workspace (core/cli/registry/dashboard); build the `rv-runner` image; a few mirror libs + apps in `rippleview-examples` (Angular, mimicking the `@op/*` convention) — these prove the gate end-to-end and run under the examples' OWN separate Jenkins pipeline. The net-new UI automation tests (Gherkin `.feature` + YAML step definitions, executed by `rv`) live in `RippleViewTests`, never inside the libs.

2. **Prove determinism:** run one YAML A11y test in the runner image against the example app in compose; verify identical results local vs CI.

3. **Build the isolation unit:** Verdaccio (PoC) + npm `overrides` injection (`npm install --legacy-peer-deps`) + `app-runtime` multi-stage build (built only for the example apps) + compose unit with healthcheck + `--exit-code-from`. Demonstrate: publish a beta → build example consumer against it → run → collect → teardown.

4. **Registry + impact selection:** scanner populates `registry.json`; selector lists impacted apps from a candidate.

5. **Wire the gate pipeline:** Jenkins stages ①–⑦; parallel fan-out over impacted apps.

6. **Visual engine (VC-0→VC-3):** pixel→semantic/geometry/style→route crawl→role probes.

7. **Coverage + issue/threshold + dashboard read views.**

8. **Static Layer-0 gate** on the library/theme repos.

9. **Enterprise hardening:** Plugin SPI, redaction/secrets, RBAC/audit, notifications, `rv init`, metrics; migrate compose→k8s, JSON→Mongo.

10. **Rollout:** pilot 1–2 apps + most-consumed lib; Phase-0 baseline the rest; enable ratchet org-wide.

---

## 9. Two profiles — Local PoC vs Production

The **framework code is identical** in both profiles; only the *surrounding infrastructure* changes. Because the design uses abstractions (file store mirrors Mongo documents; the same Docker images run under compose or k8s; the CLI is the only entry point), the PoC→Production move is a **configuration swap, not a rewrite**.

### 9.1 Tech-stack profile (side-by-side)

****
****

****
****

````****
``

****``
****

****``
****

``
****

``

``

``

| Layer | Local PoC (your machine) | Production (after PoC) |
| --- | --- | --- |
| Compute | Docker Desktop (Mac/Windows/Linux) | CI runners + Kubernetes cluster |
| Isolation orchestration | docker-compose | Kubernetes Jobs |
| Candidate library swap | local file:/npm pack override → then Verdaccio (local Docker), via npm `overrides` + `--legacy-peer-deps` | Nexus private registry (`@op:registry`, repo `opnpmprivate`) — selected by `.npmrc`/config, no code change |
| Result store | local JSON files (./.rv/results/) | MongoDB (same document shape) |
| Baseline/artifact store | local folder (./.rv/baselines/) | S3 / MinIO |
| CI driver | rv CLI run by hand / a local Jenkins | Jenkins or GitHub Actions (or any) via the CLI |
| Reporting | allure serve (local) | hosted Allure + Prometheus/Grafana |
| Dashboard | local Node app reading ./.rv/ | deployed web app + SSO |
| Secrets | .env file (git-ignored) | Vault / Secrets Manager / CI secrets |
| AI agents | optional / off | dev-side, enabled |

### 9.2 Local PoC — setup & run (OS-neutral)

1. **Install once:** Docker Desktop, Node 20 (npm ships with it). (Everything heavy runs in Linux containers — host OS is irrelevant.)

2. **Build images:** `rv-runner` (Playwright base + CLI). Example app + lib live in `rippleview-examples`.

3. **Simplest version swap (no registry):** build the candidate lib locally and point an npm `overrides` entry at the folder/tarball (installed with `--legacy-peer-deps`, matching the real `@op/*` consumer trees):
   `"overrides": { "@op/core-controls": "file:../examples/angular/libraries/core-controls" }`

4. **Run the isolation unit:** `rv gate --local` — the CLI brings up the compose unit (`app` + `runner`), waits on `service_healthy`, runs Layer 0–4 + functional, writes JSON results + `allure-results` to `./.rv/`, then tears down.

5. **View results:** `allure serve ./allure-results`; start the local dashboard to read `./.rv/`.

6. **Add Verdaccio (still local) when** you want to test the real *versioning* model (`@18.1.0` vs `@18.3.3-beta.1` per consumer, §6.1) — one local Docker container, no cloud.

> 

Nothing above touches AWS/S3. Internet is needed only to *pull images and npm packages the first time*; afterwards it runs offline.

### 9.3 Production — what changes after PoC

- Swap **compose → Kubernetes Jobs** (same images).

- Point the result writer at **MongoDB** (same Mongo-shaped documents) and baselines at **S3/MinIO** (same paths).

- Publish candidates to the **Nexus private registry** (`@op:registry`, repo `opnpmprivate`) instead of Verdaccio — a `.npmrc`/config switch, no framework code change.

- Wire **secrets** to Vault/SM; enable **SSO + RBAC/audit** on the dashboard; turn on **Prometheus/Grafana** export.

- Note the production app-deployment reality the design converges to: built static assets ship to **AWS S3** (`aos-static-ui-repository`) → **nginx/CDN** with base-href. Docker isolation is the PoC mechanism; in the PoC the app-runtime container is built only for the example apps.

- Connect the chosen **CI** (§10) and **Notifier** (SCM checks/Slack/issue tracker).

### 9.4 Why migration is low-risk

Each production swap targets an interface the PoC already uses: a `ResultStore` (file → Mongo), a `BaselineStore` (folder → S3), a `RegistrySource`, and the `rv` CLI (unchanged). The PoC is a faithful small-scale mirror, not a throwaway.

---

## 10. CI-agnostic integration (Jenkins, GitHub Actions, any)

The framework **embeds no CI logic**. The **`rv` CLI is the universal contract** — any CI system only has to: (1) check out, (2) pull/build the runner image, (3) call `rv …`, (4) collect artifacts. Real logic lives in the CLI, so CI files stay tiny and interchangeable.

**What every CI provides identically:**
- Calls the same commands: `rv scan`, `rv gate`, `rv run`, `rv report`.
- Consumes the same **CI-neutral outputs:** process **exit code** (pass/fail), **JUnit XML** + **Allure results** + a **`summary.json`** (verdicts, drift, confidence, coverage).
- Status checks/PR comments go through the pluggable **Notifier** (GitHub Checks API, Bitbucket, GitLab, Slack/Teams, issue tracker) — selected by config, not hard-coded.

**Jenkins (PoC & prod):**

```groovy
stage('RippleView Gate') {
  steps { sh 'rv gate --candidate $LIB@$VER --out ./.rv' }
  post  { always { junit '**/junit.xml'; archiveArtifacts '.rv/**' } }
}
```

**GitHub Actions (drop-in equivalent):**

```yaml
- run: rv gate --candidate ${{ inputs.lib }}@${{ inputs.ver }} --out ./.rv
- uses: actions/upload-artifact@v4
  with: { name: rv-results, path: ./.rv }
```

Both invoke the **identical** `rv gate` command. Switching CI is a few lines of YAML/Groovy — never a framework change. (Bitbucket Pipelines / GitLab CI follow the same shape.)

---

## 11. OS neutrality (Mac / Windows / Linux)

- **All heavy work runs in Linux containers** (Playwright runner, built app, Verdaccio) — the host OS never affects results. This is also why rendering stays deterministic across machines.

- **Host-side tooling is the Node `rv` CLI** (cross-platform) — not shell scripts. The CLI drives docker-compose via child process/Docker API, so the same command works on Mac, Windows, and Linux. Avoid bash-isms in any wrapper; use Node (`wait-on`, `cross-env`) and forward-slash paths.

- **Docker volumes & compose** behave identically across Docker Desktop (Mac/Windows) and Docker Engine (Linux).

- **Resource sizing:** the Playwright image (~2 GB) plus building an app and running a browser is the heaviest part; give Docker Desktop a healthy allocation (≈4+ CPUs, 8 GB RAM) on **either Mac or Windows**. Not a blocker for a 1–2 app PoC, just size it.

---

## Sources

- [Playwright Docker — official image & CI usage](https://playwright.dev/docs/docker) · [Docker Hub: microsoft/playwright](https://hub.docker.com/r/microsoft/playwright)

- [Verdaccio — lightweight private registry](https://github.com/verdaccio/verdaccio) · [Testing packages locally with Verdaccio](https://dev.to/one-beyond/different-approaches-to-testing-your-own-packages-locally-verdaccio-5hd8)

- [Chromatic TurboSnap (impacted selection)](https://www.chromatic.com/docs/turbosnap/)

## 8. Top risks & mitigations

``

``

| Risk | Mitigation |
| --- | --- |
| Autonomous crawler state-explosion / destructive clicks | Bounded depth + allow/deny interaction policy; treat as Phase-1 spike, gate value on Module 2 first |
| Baseline-approval fatigue (false positives) | New-code ratchet, characterization baselines, AI triage, RBAC approvals |
| Base-test ↔ library version drift | Per-`@op/<lib>` lockstep publish (each base-test version tracks the specific `@op/<lib>` version + suffix channel it covers, not one global component version); api-extractor enforces semver |
| Pixel-layer flakiness | Dockerized determinism; pixel advisory before gating; SSIM threshold tuning |
| Poorly-accessible legacy apps | data-testid fallback + a11y ratchet to improve over time |
| Adoption resistance across consumer teams | Phase-0 zero-effort baselines + rv init + golden-path docs |

---
