# Verdaccio — the local registry behind the Demo Fixture Suite

[Verdaccio](https://verdaccio.org/) is a lightweight, self-hosted private npm registry. It speaks the same protocol as the real npm registry, so any `npm install`, `npm publish`, or `npm view` works against it unchanged — point `--registry` at it instead of `https://registry.npmjs.org/`.

## Why this repo uses it

RippleView's gate has to actually `npm install` a candidate library version and run a real build against it — that only works if the candidate is a real, installable package, not just files on disk. Verdaccio gives the Demo Fixture Suite a real registry to publish every fixture library version to, so the gate's behavior against these fixtures is genuine, not simulated.

Two distinct uses exist across the two RippleView repos — don't confuse them:

| | `rv` (framework repo) | `rippleview-examples` (this repo) |
|---|---|---|
| Compose file | `docker/verdaccio/docker-compose.yml` | same file, run from this repo's checkout of that path |
| Container | `rv-verdaccio`, port `4873` | same container |
| Lifecycle | **ephemeral** — torn down per test run | **persistent** — hosts the long-lived, version-tagged fixture libraries below |
| Config | `docker/verdaccio/config.yaml` — intentionally permissive (`publish`/`unpublish: $all`), since the instance is throwaway | same config, reused as-is |

## Starting it

```bash
cd "<path-to>/rv/docker/verdaccio"
docker compose up -d
# verify:
curl http://localhost:4873/-/ping
```

The config proxies any package name Verdaccio doesn't recognize to the real npmjs registry (`uplinks.npmjs`) — by design, so a consumer can resolve ordinary dependencies (`rxjs`, `@angular/core`, etc.) *and* fixture packages through the same registry, exactly like a real org's internal registry would. This is also why fixture package names **must be scoped** (`@op/*`) — see the collision note below.

## What's currently published

```bash
npm view "@op/core-controls" versions --registry http://localhost:4873
npm view "@op/data-grid" versions --registry http://localhost:4873
npm view "@op/shared" versions --registry http://localhost:4873
```

| Package | Published versions | Source | Notes |
|---|---|---|---|
| `@op/core-controls` | `15.0.0`, `15.1.0`, `15.2.0` | `angular/libraries/lib-ng15/projects/core-controls` | Button/Input/MultiSelect/Form bundle |
| `@op/core-controls` | `17.0.0`, `17.1.0`, `17.2.0` | `angular/libraries/lib-ng17/projects/core-controls` | Same package name, ng17 toolchain |
| `@op/data-grid` | `15.0.0`, `15.1.0`, `15.2.0` | `angular/libraries/lib-ng15/projects/data-grid` | AG Grid 27 wrapper |
| `@op/data-grid` | `17.0.0`, `17.1.0`, `17.2.0` | `angular/libraries/lib-ng17/projects/data-grid` | AG Grid 30 wrapper |
| `@op/shared` | `1.0.0` | `angular/libraries/lib-ng15/projects/shared` | Internal plumbing (`LoggerService`, `ErrorHandler`, etc.) `core-controls` depends on. NOT oracle-tracked — same as a dependency on `rxjs` isn't |
| `@op/shared` | `2.0.0` | `angular/libraries/lib-ng17/projects/shared` | Same name, different major — required because its `@angular/core` peer differs by generation (see below) |

Each package's `x.0.0` → `x.1.0` → `x.2.0` progression is a baseline → compatible-change → deliberate-regression sequence (see [`ARCHITECTURE.md`](ARCHITECTURE.md) for what each regression actually is and how it was verified). Each version is a **git tag** on one evolving source tree, not a parallel directory; `scripts/publish-fixture-variant.mjs` materializes each tag in an isolated `git worktree`, builds it with `ng build`, and publishes it.

## Two real things this caught (worth knowing before publishing more fixtures)

1. **Unscoped names collide with the real public registry.** The first attempt published `shared`, `data-grid`, and `core-controls` without the `@op/` scope. Verdaccio's `uplinks.npmjs` proxy silently resolved these against real, unrelated public packages (`data-grid` is a real virtual-dom grid library; `shared` is a real "objects over MongoDB" package) — caught via `npm view` returning the wrong package's description. **Always scope fixture packages.**
2. **The same package name can't share a version across incompatible peer requirements.** `@op/shared`'s ng15 build needs `@angular/core ^15.2.0`; its ng17 build needs `^17.0.0`. Publishing both as `1.0.0` under the one name would either collide (version already taken) or misrepresent compatibility. The fix: treat the peer-incompatible rebuild as a real new major (`2.0.0`) — same as `core-controls`/`data-grid` already do via their own major-tracks-generation convention, just applied to the internal dependency too.

## Resetting

The instance keeps everything in a docker volume (`verdaccio-storage`). To start over from nothing:

```bash
docker compose down -v   # wipes published packages
docker compose up -d
node scripts/publish-fixture-variant.mjs --workspace angular/libraries/lib-ng15 --project shared --tags shared-v1.0.0 --registry http://localhost:4873
node scripts/publish-fixture-variant.mjs --workspace angular/libraries/lib-ng15 --project core-controls --tags core-controls-v15.0.0,core-controls-v15.1.0,core-controls-v15.2.0 --registry http://localhost:4873 --build-first shared
node scripts/publish-fixture-variant.mjs --workspace angular/libraries/lib-ng15 --project data-grid --tags data-grid-v15.0.0,data-grid-v15.1.0,data-grid-v15.2.0 --registry http://localhost:4873
node scripts/publish-fixture-variant.mjs --workspace angular/libraries/lib-ng17 --project shared --tags shared-v2.0.0-ng17 --registry http://localhost:4873
node scripts/publish-fixture-variant.mjs --workspace angular/libraries/lib-ng17 --project core-controls --tags core-controls-v17.0.0,core-controls-v17.1.0,core-controls-v17.2.0 --registry http://localhost:4873 --build-first shared
node scripts/publish-fixture-variant.mjs --workspace angular/libraries/lib-ng17 --project data-grid --tags data-grid-v17.0.0,data-grid-v17.1.0,data-grid-v17.2.0 --registry http://localhost:4873
```
