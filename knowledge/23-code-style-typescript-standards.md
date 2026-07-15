# Code Style & TypeScript Standards

> **ℹ️ Info**
>
> **Source of Truth.** Canonical reference for **Code Style & TypeScript Standards** within the RippleView framework. Part of the **RippleView** documentation set.

> 

Code-style and TypeScript standards for all `@rippleview/*` packages. Optimised to be unambiguous: prefer a table or a canonical snippet over prose. When a linter rule encodes a standard, the linter is the source of truth.

## Baseline toolchain (standardised — do not deviate per-package)

****``
``

****``
````

****

****

****

****

****

****

| Concern | Standard | Notes |
| --- | --- | --- |
| Language | TypeScript 5.x, strict: true | No new .js in framework packages. |
| Modules | ESM ("type": "module") | Use node: protocol for builtins (import { readFile } from "node:fs/promises"). |
| Runtime | Node 20 LTS | Engine code must not use APIs newer than the supported floor. |
| Package manager | npm workspaces | Lockfile committed. Version injection for the isolation pipeline uses the npm `overrides` field in package.json, applied with `npm install --legacy-peer-deps`. |
| Lint | ESLint (typescript-eslint, strict + stylistic) | CI fails on any error; warnings are not allowed to accumulate. |
| Format | Prettier | Never hand-format. Format-on-save. |
| Unit test | Vitest | Fast, TS-native, ESM-first. |
| Browser/e2e/visual | Playwright Test | Single browser-automation dependency (Rule G2/G12). |

## Required `tsconfig` compiler options

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "moduleResolution": "Bundler",
    "declaration": true,        // every package emits .d.ts
    "sourceMap": true
  }
}
```

## Naming conventions

``````
``````

``
``

``**``**
``````

``
``

``
``

``````

****``
``

``
``

``
````

``
````

| Kind | Convention | Example |
| --- | --- | --- |
| Package | @rippleview/<kebab> (framework's own packages), @RippleViewTests/<lib> (base tests, versioned in lockstep to the `@op/<lib>` they cover), @rippleview/plugin-<name> (plugins). Libraries under test keep their own `@op/*` scope. | @rippleview/core, @RippleViewTests/datagrid (covers @op/datagrid), @rippleview/plugin-storybook |
| File | kebab-case.ts; one primary export per file where practical | result-store.ts |
| Type / Interface / Class | PascalCase. No I prefix on interfaces. | ResultStore, SceneProvider, DriftScore |
| Function / variable | camelCase; verbs for functions | computeDriftScore() |
| Constant (module-level, fixed) | UPPER_SNAKE_CASE | DEFAULT_BYPASS_THRESHOLD |
| Type parameter | T, then descriptive TScene, TResult |  |
| Enum-like | Prefer string literal unions over enum | type Severity = "info" \| "minor" \| "major" \| "critical" |
| CLI command/flag | kebab-case | rv gate --candidate-version |
| Config key (YAML) | camelCase | baseUrl, minFunctionalCoverage |
| JSON document field | camelCase, Mongo-shaped | runId, acceptedBugCount |

## Banned patterns (enforced)

``
``

``

``
``****

``

****

``

``

``

``````

``

| Banned | Use instead |
| --- | --- |
| any (implicit or explicit) | unknown + a type guard, or a real type |
| as casts to silence errors | Narrowing, type guards, or fix the type |
| // @ts-ignore | // @ts-expect-error with a reason, or fix it |
| enum | string-literal union |
| Default exports in library packages | Named exports only (stable public surface) |
| console.log in library code | the injected structured logger |
| Throwing bare strings | throw new RippleViewError(code, message, context) |
| XPath / CSS selectors / data-testid lookups | A11y-tree locator (Rule G2) |
| Hardcoded design tokens, !important, ::ng-deep, ViewEncapsulation.None | semantic theme variables (Rule G15) |
| Reading process.env deep in modules | resolve in config layer, pass values down |

## Error handling

- One error type hierarchy rooted at **`RippleViewError`** with a stable `code` (string), a human `message`, and a structured `context` object. Codes are documented and never reused for a different meaning.

- **Findings are data, not exceptions.** A failed assertion, a build break (G10), or a visual diff is a *result document*, not a thrown error. Reserve exceptions for programmer/infra errors.

- Never swallow errors silently. Either handle, wrap with context, or rethrow.

- `async` everywhere for I/O; **no floating promises** (lint-enforced). Always `await` or explicitly `void`.

## Comments & docs

- Public exported symbols get a **TSDoc** comment (`/** ... */`) — one line of intent is enough; api-extractor surfaces it.

- Comment *why*, not *what*. Match the density of surrounding code.

- No commented-out code in commits.

## Module boundaries

- `@rippleview/core` exposes a typed public API via a single `index.ts` barrel; everything else is internal (`/internal` not exported).

- Cross-package imports use the package name (`@rippleview/core`), never deep relative paths into another package's `src`.

- Dependency direction is one-way (see *Repository & Module Layout*); never create a cycle.
