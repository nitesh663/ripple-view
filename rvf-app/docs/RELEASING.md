# Releasing

Maintainer reference for versioning and publishing `@rippleview/*` packages.

## 1. Record a changeset

```sh
npm run changeset
```

Interactive prompt: select the affected package(s), choose a bump type (`patch` / `minor` / `major`), and write a one-line summary. This writes a file under `.changeset/` that must be committed alongside the feature branch.

## 2. Apply changesets — bump versions

```sh
npm run version
```

Runs `changeset version`. Consumes all pending `.changeset/*.md` files, updates each package's `package.json` version, and appends entries to `CHANGELOG.md`. Commit the result on `main`.

## 3. Publish

```sh
npm run release
```

Runs `changeset publish`. Publishes changed packages to the npm registry, creates git tags, and pushes them. Requires `NPM_TOKEN` in the environment (from vault → env, never committed — G18).

## 4. API surface tracking

Each package runs `api-extractor run` as part of its build step. The generated report lands in `packages/<name>/etc/<name>.api.md`.

- The `.api.md` file is committed to the repo.
- During PR review, diff the file to catch unintentional public-API changes.
- A breaking public-API change requires a `major` changeset and a semver major bump (G16).

The shared baseline config is `api-extractor.base.json` at the repo root. Each package's `api-extractor.json` extends it via `"extends": "../../api-extractor.base.json"`.

## 5. Branch strategy

- All development happens on `feat/<scope>-<short>` branches cut from `main`.
- Squash-merge to `main` after human approval and a green gate (G20).
- Releases are tagged from `main` by `changeset publish` — never tag manually.
