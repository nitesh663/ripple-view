# Plugin SPI & Adapter Authoring

> **ℹ️ Info**
>
> **Source of Truth.** Canonical reference for **Plugin SPI & Adapter Authoring** within the RippleView framework. Part of the **RippleView** documentation set.

> 

How to extend RippleView without forking core (Rule G11). Every extension point is a TypeScript interface in `@rippleview/core`, discovered and loaded by **dynamic import** from config. If you are adding framework/vendor support, you are writing a plugin — full stop.

## The contract

- An extension is an npm package (or local module) that **exports a factory** returning an object implementing one or more `@rippleview/core` SPI interfaces.

- It is referenced in config by module specifier; core `import()`s it at runtime. Core never hard-codes a vendor.

- Plugins depend on `@rippleview/core` **types only** (`import type`), never on its internals.

```typescript
// @rippleview/plugin-storybook/src/index.ts
import type { SceneProvider, SceneProviderFactory } from "@rippleview/core";

export const createProvider: SceneProviderFactory = (ctx) => {
  return {
    name: "storybook",
    async listScenes() { /* ... return Scene[] */ },
    async renderScene(scene, page) { /* drive the page to the scene */ },
  } satisfies SceneProvider;
};
```
```yaml
# rippleview.config.yaml — wiring the plugin
visual:
  sceneProvider:
    module: "@rippleview/plugin-storybook"
    export: "createProvider"
    options: { storybookUrl: "http://localhost:6006" }
```

## Core extension points (interfaces you may implement)

**``**
****
``````

**``**

**``**

**``**
****
````

**``**

````

**``**
``
``

**``**

``````

**``**
``
````

| SPI | Purpose | Built-ins |
| --- | --- | --- |
| SceneProvider | Enumerate + render the things to validate. Separated from the proven capture→diff→review pipeline so a failed crawl never breaks the system (Rule G12). | storybook, route-crawler, script |
| StateProbe | Generic ARIA-role-derived "play functions" that drive a component through its states. | role-based probes |
| DiffSignal | Contribute one signal (geometry / computed-style / pixel / value-delta) to the multi-signal verdict. | geometry, computed-style, pixel |
| ResultStore | Persist result documents. Same document shape across impls (Rule G5). | file (PoC), mongo (prod) |
| BaselineStore | Store/fetch visual baselines. | folder (PoC), s3 (prod) |
| RegistrySource | Provide the knowledge registry derived from package.json. | package-scan |
| Notifier | Emit gate outcomes (SCM status check / Slack / issue tracker). Pluggable so CI stays neutral (Rule G7). | scm-check, slack, issue-tracker |
| SecretsProvider | Resolve secrets vault → env → .npmrc (Rule G18). | env, vault |

## Authoring rules

1. **Stateless & idempotent.** A provider/adapter holds no cross-run state; everything needed comes from the `ctx` and method args.

2. **Honour determinism (G13).** Providers must not introduce time/animation/network nondeterminism; if they navigate, they wait on stable signals, never fixed sleeps.

3. **Fail as a finding where it's a finding (G10).** A provider that can't reach a scene reports it; it doesn't throw to crash the gate.

4. **No app-coupling leaks into core.** App specifics live in plugin `options` from config, not in `@rippleview/core`.

5. **Versioning:** a plugin declares the `@rippleview/core` SPI major version it targets as a peer dependency. A breaking SPI change is a core **major** bump (Rule G16).

6. **Naming:** `@rippleview/plugin-<name>`; factory export name is documented in the package README and referenced explicitly in config (`export:`).

7. **Redaction (G18):** providers that capture screenshots/network must respect the configured PII masks and route intercepts.

## Adding a new Store adapter (PoC→Prod parity worked example)

The PoC `file` ResultStore writes JSON files; the prod `mongo` one writes documents. **Both must accept and return the identical document shape** — that is what makes migration a config swap, not a rewrite (Rule G5).

```typescript
import type { ResultStore, RunResult } from "@rippleview/core";
export const createMongoStore = (ctx): ResultStore => ({
  async putRun(doc: RunResult) { /* insert doc AS-IS */ },
  async getRun(runId: string): Promise<RunResult | null> { /* find */ },
  // ...same methods, same shapes as the file store
});
```

If you find yourself changing a document's shape to fit a store, stop — you are violating G5.
