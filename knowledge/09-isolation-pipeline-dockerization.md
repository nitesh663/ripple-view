# Isolation Pipeline & Dockerization

> **ℹ️ Info**
>
> **Source of Truth.** Canonical reference for **Isolation Pipeline & Dockerization** within the RippleView framework. Part of the **RippleView** documentation set.

## 2. Dockerization design

### 2.1 Why Docker

Pixel/geometry results must be identical on a laptop and a CI node. Host fonts, GPU, and OS sub-pixel rendering differ; the official Playwright image eliminates that by baking fonts, browser binaries, and OS libraries into one Ubuntu-LTS image rebuilt per Playwright release. This is the determinism foundation for NFR-ENV.

### 2.2 The images

**(A) `rv-runner` — the test engine image**

```bash
FROM mcr.microsoft.com/playwright:v1.xx-noble      # browsers + fonts + OS libs baked
WORKDIR /rv
COPY packages/cli /rv/cli                          # @rippleview/cli + core (prebuilt)
RUN npm i -g ./cli
ENTRYPOINT ["rv"]                                  # e.g. rv run --config ...
```

Role: runs Layer 0–4 + functional against a served app URL; writes result docs + `allure-results` to a mounted volume. Deterministic by construction.

**(B) `app-runtime` — the consumer app under test (built per run)**
Multi-stage: build with the candidate library, then serve a **production build** (never a dev server — dev servers are non-deterministic and slow).

```bash
# --- builder ---
FROM node:20 AS build
WORKDIR /app
COPY . .
COPY .npmrc .                                        # points the @op scope at the registry (Verdaccio in PoC / Nexus in prod)
RUN node scripts/inject-override.js                  # writes npm "overrides" → candidate version
RUN npm install --legacy-peer-deps && npm run build  # --legacy-peer-deps required by the @op tree; peer-dep/compile break = a finding
# --- runtime ---
FROM nginx:alpine                                    # SPA static; (node:20 for SSR)
COPY --from=build /app/dist /usr/share/nginx/html
HEALTHCHECK CMD wget -q --spider http://localhost:80/ || exit 1   # wget ships in alpine; runs inside the Linux container (host-OS independent)
```

Role: serves the consumer app built against the **candidate** library, with a healthcheck the runner waits on. The `nginx:alpine` static-serve runtime mirrors how AOS apps are deployed in production (static build → AWS S3 `aos-static-ui-repository` → nginx/CDN). The `app-runtime` image is net-new per consumer (most real apps have no Dockerfile today); **in the PoC it is built only for the mirror example apps** — we do not add Dockerfiles to the real consumer repos.

> **PoC vs. production deployment.** Docker isolation is the **PoC** mechanism for building+serving a candidate deterministically. The **production** deployment reality the design converges to is the existing AWS **S3 static** model (`aos-static-ui-repository` + nginx/CDN, base-href per app); the gate still builds/serves the candidate in isolation, but adoption reuses each app's existing static build rather than introducing a new runtime container.

**(C) Support services (as needed):** Verdaccio (ephemeral registry, **PoC only** — production points the `@op` scope at Nexus `opnpmprivate` via a single `.npmrc`/config switch, no code change), MinIO (baseline/artifact store), Mongo (post-MVP). Run as sidecars/services.

### 2.3 Determinism guarantees layered in

- Image: pinned Playwright tag (fonts/DPR/engines fixed).

- Runtime: freeze CSS animations/transitions/caret **and** JS timers; wait `network-idle` + `fonts.ready` + images decoded.

- Data: API-seeded fixtures + fixed clock + dynamic-zone masking.

- Pixel: YIQ threshold + anti-alias ignore.

### 2.4 Local ↔ CI parity

Developers run the **same compose stack** locally (`rv gate --local`) → identical images, identical determinism. No "works on my machine" gap.

---

## 3. The isolation pipeline — running an affected consumer against a candidate (THE BLACK AREA)

### 3.1 Problem restated

Given `@op/datagrid@16.0.0-ng17-beta.1` (an `@op/*` package on its generation channel), for **each impacted consumer** (each on its own current version), in isolation and in parallel: get the app, swap in the candidate, build, serve, run automation **with the app's current base-test version** (backward-compat, §6.1), collect results, tear down.

### 3.2 Version-swap mechanics (the core trick)

Two equivalent channels — pick per environment:

**Channel 1 — private registry beta tag (prod):** the library pipeline publishes `…@16.0.0-ng17-beta.1` under a `beta` dist-tag to the existing private registry (**Nexus** `opnpmprivate`, the `@op` scope's prod registry).

**Channel 2 — Verdaccio (ephemeral, zero pollution; PoC):** boot Verdaccio in the CI job, `npm publish` the candidate to it, point `.npmrc` for the `@op` scope at `http://verdaccio:4873`. *(This is precisely how angular-cli/Storybook test their packages against a throwaway npm registry — proven.)* Channel 1 vs. 2 is a `.npmrc`/config switch, no code change.

Then in a **throwaway copy** of the consumer repo, inject an npm override so the candidate wins even transitively:

```json
// injected into package.json before install (never committed)
"overrides": { "@op/datagrid": "16.0.0-ng17-beta.1" }   // npm "overrides"; yarn equivalent: "resolutions"
```

`npm install --legacy-peer-deps` → `npm run build` (the `@op` tree requires `--legacy-peer-deps`). A peer-dependency or compile break here is **not an error to hide — it is a backward-compat finding** (confidence = 0), captured and reported.

### 3.3 The per-app isolation unit

One disposable unit per (app × candidate). MVP = docker-compose; prod = a Kubernetes Job/Pod.

```text
            ┌──────────────────────── isolation unit (per app) ────────────────────────┐
            │                                                                           │
            │   [ app-runtime ]  ⇠ built with candidate lib, serves :80 (HEALTHCHECK)   │
            │        ▲                                                                  │
            │        │ wait-for-healthy → BASE_URL                                      │
            │   [ rv-runner ]  ⇢ resolves base tests @ APP'S CURRENT version          │
            │        │             runs Layer0–4 + functional + a11y + vitals           │
            │        ▼                                                                  │
            │   results volume → result docs (Mongo-shaped) + allure-results            │
            └───────────────────────────────────────────────────────────────────────────┘
```

docker-compose (generated per app):

```yaml
services:
  app:
    build: { context: ./app, dockerfile: app-runtime.Dockerfile }
    healthcheck: { test: ["CMD","curl","-f","http://localhost:80/"], interval: 5s, retries: 20 }
  runner:
    image: rv-runner:latest
    depends_on: { app: { condition: service_healthy } }   # the "wait for output" guarantee
    environment: { BASE_URL: "http://app:80", RippleView_GATE: "backward-compat", TAGS: "@datagrid" }
    volumes: ["./results:/rv/results"]
  # app healthcheck (inside container): test: ["CMD-SHELL","wget -q --spider http://localhost:80/ || exit 1"]
```

Run + wait + collect + teardown:

```text
docker compose up --abort-on-container-exit --exit-code-from runner   # blocks until runner exits
# collect ./results → push to S3 under results/<dept>/<app>/<runId>/
docker compose down -v                                                 # teardown + data purge (ORC-04)
```

### 3.4 The six stages inside one unit

1. **Provision** — clone consumer @ pinned ref into a throwaway workspace; inject override.

2. **Build** — install + production build in the builder stage. *Fail ⇒ confidence 0, finding "build/compat break", skip 3–6.*

3. **Serve** — produce artifact; start `app` container; healthcheck flips healthy.

4. **Resolve tests** — runner fetches base-test package **@ app's current version** + app's `extend` tests.

5. **Run + wait** — `depends_on: service_healthy` gates start; runner executes and **the orchestrator blocks on `--exit-code-from runner`** (this is exactly the "wait for output" mechanism); results written to the volume.

6. **Collect + teardown** — push results/Allure to the artifact store; `compose down -v`.

### 3.5 Failure & flake handling

| Situation | Handling |
| --- | --- |
| Install/peer-dep/compile break | Backward-compat finding, confidence 0, fail fast |
| App never healthy (timeout) | Infra error → bounded retry, then mark unit errored (not a product verdict) |
| Test timeout / crash | Flake policy: retry N; pass-on-retry ⇒ flagged flaky, not green (§17.6) |
| Verdaccio/registry down | Retry; fail the gate run, not the product |

### 3.6 Scaling: MVP → production

- **MVP:** Jenkins `parallel{}` over impacted apps; each app = its own compose unit on the agent. Bound by agent count.

- **Production:** each unit = a **Kubernetes Job** (Pod with `app` + `runner` containers sharing `localhost`, or `app` Service + `runner` Job). Jenkins submits Jobs; collects artifacts from S3. Sharding within an app via multiple runner workers (ORC-02).

- **Caching for SLA:** persistent npm cache + Docker layer cache + Verdaccio/Nexus upstream cache + base-image pre-pull; **copy-unchanged** baselines (TurboSnap-style) skip unaffected scenes.

---

### 3.7 Consumer code acquisition — push-not-pull (BundleStore)

The Provision step in §3.4 says "clone consumer @ pinned ref." Taken literally that forces RippleView to hold SCM credentials for every consumer repo — tokens/deploy-keys to distribute, rotate, and risk leaking across the consumer app teams. We invert the trust boundary instead: **push, don't pull**. RippleView never holds SCM credentials and never clones consumer repos. Each consumer's own CI (which already has checkout) produces a sanitized, content-addressed bundle and submits it.

- **The bundle** — a content-addressed (sha256) archive of source + lockfile(s) + `rippleview.config.yaml`; excludes `node_modules`/`.git`/`dist`; secrets are scrubbed client-side at `rv bundle` time and re-checked server-side (a shared-registry artifact is readable by anyone with pull access).
- **BundleStore SPI (profile parity)** — mirrors the existing ResultStore (file→Mongo) and BaselineStore (folder→S3) pattern. *LocalZipBundleStore* (PoC): a local store directory; RippleView unzips into the throwaway workspace; runs fully offline. *OciBundleStore* (prod): `oras push/pull` the bundle as an OCI artifact by digest, reusing the existing registry's RBAC/retention. PoC→prod is a config swap, no consumer change.
- **Freshness for fan-out** — push-on-merge: each consumer's CI runs `rv bundle` on every merge to main and submits, so impact-selection/fan-out (§3 / US-6.2 / US-7.1) resolves each consumer's latest bundle without any SCM access.
- **Credential surface collapses to registry auth only** — the consumer needs registry *push* (the registry they already use); RippleView needs registry *pull* (the token it already needs for the candidate library). Zero new SCM tokens or deploy keys.

**Story:** BundleStore SPI + `rv bundle` (EPIC-5, MVP); consumed by the isolation unit (US-5.4).

### 3.8 Remote gate delegation & the in-process ↔ service profile

Two trigger topologies, one mechanism (both first-class):

- **(A) Library-publisher fan-out** — publish the candidate to `beta` → `rv scan` lists impacted consumers → one run per consumer (latest registered bundle) → an all-pass aggregate (within policy) gates **promoting `beta`→stable dist-tag**. The beta is a test artifact; the promotion is what is actually blocked.
- **(B) Consumer-side upgrade** — a dependency-bump PR pipeline delegates a run for its own app and blocks its merge on the verdict.

**Wait contract:** `rv gate --submit --wait` long-polls the run to a terminal state and exits 0 (pass) / non-zero (fail) — the exit code is the gate, working in any CI with no plumbing; `--callback <url>` POSTs the verdict for long fan-outs (Notifier-fired). On red, the dashboard run report (findings + Allure traces) drives triage — create/link an issue, waive with RBAC+audit, or accept-baseline — then re-run and continue.

**In-process ↔ service profile (design lock):** the orchestrator is a library callable *in-process* — the PoC `rv gate --local` runs the whole pipeline with no service to stand up (no external dependency); production exposes the *same* core behind a control-plane API (`POST /v1/runs`, `GET /v1/runs/{id}`) with per-tenant token auth. PoC→prod is a deployment/profile swap, never a rewrite. This principle is carried as an added AC on US-5.4 and US-7.1 so it is honored during the MVP.

**Story:** remote gate delegation (EPIC-7, Product Backlog). The promotion-on-green gate itself is US-7.2.

## 6. Data & artifact flow

```text
 runner → /rv/results (volume)
        ├─ runs/<runId>.json        (Mongo-shaped, tenant-tagged)
        ├─ results/*.json           (per-test findings, severities, value deltas)
        └─ allure-results/*         (forensic traces)
        ▼ CI publishes
 S3/MinIO: results/<dept>/<app>/<runId>/...   +   baselines/<app>/<version>/...
        ▼ ingest (file-scan MVP → Mongo)
 Dashboard backend → Fleet view · Run report · Coverage · Code Health · drift/confidence
 Allure report → published as CI artifact / static site (links from dashboard)
```

---
