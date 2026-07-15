# @rippleview/core

The UI-agnostic engine at the heart of RippleView. It is a pure function of its inputs: stateless, framework-free, and driven entirely by config + data.

Design source of truth: [The Agnostic Engine & Configuration design doc]().

## Config files

RippleView splits configuration into two YAML files so global settings are not repeated and each app is self-describing.

### Workspace config — `rippleview.workspace.yaml` (one per repo)

```yaml
version: '1'
name: my-rv-workspace
packages:
  - libraries/*
  - apps/*
settings:
  strict: true
```

| Field             | Required | Description                                          |
| ----------------- | -------- | ---------------------------------------------------- |
| `version`         | Yes      | Schema version string                                |
| `name`            | Yes      | Workspace name — used as the tenant prefix           |
| `packages`        | No       | Glob patterns for package discovery                  |
| `settings.strict` | No       | Fail on warnings as well as errors (default `false`) |

### App config — `apps/<app>/rippleview.config.yaml` (one per app)

```yaml
department: platform # optional; defaults to "default"
hooks:
  auth: ./hooks/auth.ts # optional — path to auth callback
  seed: ./hooks/seed.ts # optional — path to seed callback
  teardown: ./hooks/teardown.ts
matrix:
  - browser: chromium
    viewport: { width: 1280, height: 800 }
visual:
  threshold: 0.01 # 0–1; default 0.01
sceneProvider: ./scenes.ts # optional
```

| Field              | Required | Description                                    |
| ------------------ | -------- | ---------------------------------------------- |
| `department`       | No       | Dashboard grouping label; absent → `"default"` |
| `hooks.auth`       | No       | Path to the auth callback (app-owned)          |
| `hooks.seed`       | No       | Path to the seed callback (app-owned)          |
| `hooks.teardown`   | No       | Path to the teardown callback (app-owned)      |
| `matrix`           | No       | Browser + viewport combinations to run         |
| `visual.threshold` | No       | Pixel-diff tolerance 0–1 (default `0.01`)      |
| `sceneProvider`    | No       | Path to the scene-provider module              |

### Environment variable interpolation

Any string value in either file may reference an environment variable using `${VAR_NAME}` syntax. The loader resolves substitutions at parse time and throws a `ConfigError` (code `CONFIG_ENV_MISSING`) if the variable is not set.

```yaml
hooks:
  auth: ${AUTH_HOOK_PATH}
```

## API

### Schemas (Zod)

```ts
import { WorkspaceConfigSchema, AppConfigSchema, RunContextSchema } from '@rippleview/core';

// Inferred TypeScript types
type WorkspaceConfig = z.infer<typeof WorkspaceConfigSchema>;
type AppConfig = z.infer<typeof AppConfigSchema>;
type RunContext = z.infer<typeof RunContextSchema>;
```

### Loader functions

```ts
import {
  parseWorkspaceConfig,
  parseAppConfig,
  loadWorkspaceConfig,
  loadAppConfig,
  buildRunContext,
  ConfigError,
} from '@rippleview/core';

// Parse from a YAML string (useful for testing — no filesystem I/O)
const workspace = parseWorkspaceConfig(yamlString, env);
const app = parseAppConfig(yamlString, env);

// Read from disk
const workspace = loadWorkspaceConfig('/path/to/rippleview.workspace.yaml');
const app = loadAppConfig('/path/to/apps/my-app/rippleview.config.yaml');

// Combine into a RunContext
const ctx = buildRunContext({
  workspaceConfig: workspace,
  appConfig: app,
  appName: 'my-app',
  paths: {
    workspace: '/path/to/rippleview.workspace.yaml',
    app: '/path/to/apps/my-app/rippleview.config.yaml',
    output: '/path/to/runs',
  },
});

// ctx.tenant → "my-rv-workspace:my-app"
// ctx.department → "default" (if not set in app config)
```

### RunContext shape

```ts
{
  tenant: string; // workspace.name + ':' + appName
  appName: string;
  department: string;
  paths: {
    workspace: string; // absolute path to workspace config
    app: string; // absolute path to app config
    output: string; // directory for run results
  }
  workspace: WorkspaceConfig;
  app: AppConfig;
}
```

### Error handling

All loader functions throw `ConfigError` on failure — never a raw `ZodError`.

```ts
import { ConfigError } from '@rippleview/core';

try {
  const workspace = loadWorkspaceConfig('/path/to/rippleview.workspace.yaml');
} catch (err) {
  if (err instanceof ConfigError) {
    console.error(err.code, err.message);
    // CONFIG_SCHEMA_ERROR — "Workspace config is invalid: [version] Required"
    // CONFIG_ENV_MISSING — 'Environment variable "AUTH_HOOK_PATH" is referenced but not set.'
  }
}
```

| `code`                | Cause                                                             |
| --------------------- | ----------------------------------------------------------------- |
| `CONFIG_SCHEMA_ERROR` | A required field is missing, or a value fails schema validation   |
| `CONFIG_ENV_MISSING`  | A `${VAR}` placeholder references an env variable that is not set |

## Result store

RippleView persists run results as Mongo-document-shaped JSON files (G5). The PoC uses a file-backed store; the field names are a contract and map 1:1 to a future Mongo collection without renaming.

### `RunResult` shape

```ts
{
  _id: string;        // unique run ID (UUID v4)
  tenant: string;     // workspace.name + ':' + appName
  department: string; // from app config; defaults to 'default'
  appName: string;
  verdict: 'pass' | 'fail';
  timestamp: string;  // ISO 8601
  durationMs: number;
  findings: Finding[];
}
```

Each `Finding` carries:

```ts
{
  id: string;
  component: string;
  confidence: number; // 0-1; never rounded up to force a pass (G17)
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  message: string;
}
```

### `ResultStore` interface

```ts
import type { ResultStore } from '@rippleview/core';

interface ResultStore {
  putRun(d: RunResult): Promise<void>;
  getRun(id: string): Promise<RunResult | undefined>;
}
```

### `FileResultStore`

File-backed implementation. Path layout:

```
<outputRoot>/results/<department>/<appName>/runs/<id>.json
```

Constructor:

```ts
new FileResultStore(
  outputRoot: string,
  redact?: RedactFn,   // default: identityRedact ( placeholder)
  fs?: FsMod,          // default: node:fs; injectable for tests (G13)
)
```

```ts
import { FileResultStore } from '@rippleview/core';

const store = new FileResultStore('/path/to/output');
await store.putRun(doc);
const run = await store.getRun('some-uuid');
```

### Middleware helpers

| Function                    | Purpose                                                                                                                                                |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `stampTenant(partial, ctx)` | Copies `tenant`, `department`, `appName` from `RunContext` onto a partial run document — the single authoritative place that reads these from context. |
| `identityRedact(doc)`       | Placeholder `RedactFn` that returns the document unchanged. Real PII redaction is wired in design                                               |
| `generateRunId(idGen?)`     | Returns a UUID v4 run ID. Accepts an injectable `idGen` for deterministic tests.                                                                       |

### Usage example

```ts
import { FileResultStore, stampTenant, generateRunId, identityRedact } from '@rippleview/core';

const store = new FileResultStore(ctx.paths.output);

const doc = stampTenant(
  {
    _id: generateRunId(),
    verdict: 'pass',
    timestamp: new Date().toISOString(),
    durationMs: 123,
    findings: [],
  },
  ctx,
);

await store.putRun(doc);
```

## Plugin SPI

Design source of truth: [Plugin SPI & Adapter Authoring design doc]().

RippleView extends without forking core (G11). Every framework adapter, notifier, and store is a plugin that implements one or more SPI interfaces and wraps them in an `RippleViewPlugin` container returned by a factory function.

### `RippleViewPlugin` container shape

```ts
interface RippleViewPlugin {
  readonly spiVersion: number; // must equal core's SPI_VERSION (G16)
  readonly name: string;
  sceneProvider?: SceneProvider;
  stateProbe?: StateProbe;
  diffSignal?: DiffSignal;
  baselineStore?: BaselineStore;
  registrySource?: RegistrySource;
  notifier?: Notifier;
  secretsProvider?: SecretsProvider;
}
```

A plugin implements only the SPI interfaces it needs. Unused slots are simply absent.

### SPI interfaces

| Interface         | Purpose                                                                               |
| ----------------- | ------------------------------------------------------------------------------------- |
| `SceneProvider`   | Enumerate and render the scenes (pages/stories/routes) to validate.                   |
| `StateProbe`      | Drive a component through its states via ARIA-role-based play functions (G2).         |
| `DiffSignal`      | Contribute one signal (geometry/style/pixel/value) to the multi-signal verdict (G12). |
| `BaselineStore`   | Store and retrieve visual baselines in a Mongo-document-shaped layout (G5).           |
| `RegistrySource`  | Provide knowledge registry metadata derived from package.json.                        |
| `Notifier`        | Emit gate outcomes to SCM / Slack / an issue tracker (CI-neutral core, G7).           |
| `SecretsProvider` | Resolve secrets from vault → env → .npmrc (G18).                                      |

### `loadPlugin(specifier, exportName)` usage

```ts
import { loadPlugin, PluginLoadError } from '@rippleview/core';

// Load a plugin from an npm package or local path
try {
  const plugin = await loadPlugin('@rippleview/plugin-storybook', 'createPlugin');
} catch (err) {
  if (err instanceof PluginLoadError) {
    // codes: PLUGIN_NOT_FOUND | PLUGIN_EXPORT_MISSING | PLUGIN_VERSION_MISMATCH
    console.error(err.code, err.message);
  }
}
```

The third parameter `importFn` is injectable for testing — pass a mock to avoid real module resolution in unit tests (G13).

### `PluginRegistry` usage

```ts
import { PluginRegistry, loadPlugin } from '@rippleview/core';

const registry = new PluginRegistry();

const plugin = await loadPlugin('@rippleview/plugin-storybook', 'createPlugin');
registry.register(plugin);

// Typed accessors per SPI interface
const providers = registry.getSceneProviders(); // SceneProvider[]
const signals = registry.getDiffSignals(); // DiffSignal[]
const notifiers = registry.getNotifiers(); // Notifier[]
```

### No-op built-in and authoring a plugin

The `noop-scene-provider` built-in ships with core. It is registered via the same factory path as external plugins, which proves the pattern is consistent (T-1.4.3):

```ts
import { createNoopSceneProvider, PluginRegistry } from '@rippleview/core';

const registry = new PluginRegistry();
registry.register(createNoopSceneProvider());
```

To author a plugin, create an npm package that exports a `createPlugin` factory:

```ts
// @my-scope/plugin-my-tool/src/index.ts
import type { RippleViewPlugin } from '@rippleview/core';
import { SPI_VERSION } from '@rippleview/core';

export function createPlugin(): RippleViewPlugin {
  return {
    spiVersion: SPI_VERSION,
    name: 'my-tool',
    sceneProvider: {
      name: 'my-tool',
      async listScenes() {
        /* ... */ return [];
      },
      async renderScene(scene, page) {
        /* page is unknown — cast to your framework type */
      },
    },
  };
}
```

Then load it at runtime:

```ts
import { loadPlugin, PluginRegistry } from '@rippleview/core';

const registry = new PluginRegistry();
registry.register(await loadPlugin('@my-scope/plugin-my-tool', 'createPlugin'));
```

### `SPI_VERSION` and breaking changes

`SPI_VERSION` is exported from `@rippleview/core`. Any plugin that declares a different `spiVersion` is rejected with `PluginLoadError` (code `PLUGIN_VERSION_MISMATCH`). A breaking change to the SPI requires a core major version bump (G16).

## Auth / Session hydration

Design source of truth: [The Agnostic Engine & Configuration design doc]().

RippleView supports a "capture once, share across N workers" session pattern so that test suites perform a single login at startup and inject the resulting cookies/storage into every worker context without re-authenticating.

### `AuthProvider` SPI interface

```ts
import type { AuthProvider } from '@rippleview/core';

interface AuthProvider {
  readonly name: string;
  /** Perform login and return the captured session state. */
  authenticate(ctx: unknown): Promise<AuthState>;
  /**
   * Inject a previously captured state into a new browser context.
   * The default StorageStateAuthProvider is a no-op here;
   * real cookie/localStorage injection lives in the framework plugin.
   */
  restore(state: AuthState, ctx: unknown): Promise<void>;
  /** Return true if the cached state is still valid (not expired). */
  isValid(state: AuthState): boolean;
}
```

`ctx` is typed `unknown` throughout so `@rippleview/core` stays UI-agnostic (G1). A Playwright plugin casts `ctx` to `BrowserContext`; a Puppeteer plugin casts to `Page`, and so on — core never imports any framework type.

To add support for a new framework, implement `AuthProvider` in a plugin package (`@rippleview/plugin-<name>`) and pass it to `AuthManager`. See [Plugin SPI & Adapter Authoring]() for the full authoring guide.

### `AuthHookFn` — what the app implements

The app-owned hook performs the actual login steps and returns the captured session state:

```ts
import type { AuthHookFn, AuthState } from '@rippleview/core';

const myAuthHook: AuthHookFn = async (ctx) => {
  // ctx is unknown — cast to your framework type here (in a plugin, not in core)
  const page = ctx as import('playwright').Page;
  await page.goto('/login');
  await page.getByRole('textbox', { name: 'Username' }).fill('user');
  await page.getByRole('textbox', { name: 'Password' }).fill('pass');
  await page.getByRole('button', { name: 'Sign in' }).click();
  // Return the Playwright storageState-compatible shape
  return page.context().storageState() as Promise<AuthState>;
};
```

### `StorageStateAuthProvider` — default provider

```ts
import { StorageStateAuthProvider } from '@rippleview/core';

const provider = new StorageStateAuthProvider(
  myAuthHook, // AuthHookFn — performs the actual login
  30 * 60 * 1000, // TTL in ms (default: 30 minutes)
  Date.now, // Injectable clock — override in tests for determinism (G13)
);
```

`StorageStateAuthProvider` delegates login to `hookFn`, stamps `capturedAt` and `expiresAt` on the returned state, and provides a TTL-based `isValid` check. Its `restore` is intentionally a no-op — real cookie/localStorage injection belongs in the framework plugin.

### `AuthManager` — orchestrator

```ts
import { StorageStateAuthProvider, AuthManager } from '@rippleview/core';

const provider = new StorageStateAuthProvider(myAuthHook);
const manager = new AuthManager(provider);
```

| Method              | Description                                                                       |
| ------------------- | --------------------------------------------------------------------------------- |
| `hydrate(ctx)`      | Authenticate once (or re-authenticate if expired), then restore state into `ctx`. |
| `getOrRefresh(ctx)` | Return the cached `AuthState`, authenticating only when needed.                   |
| `invalidate()`      | Force re-authentication on the next `hydrate()` call.                             |
| `state`             | Read-only cached `AuthState` (or `null` before the first hydration).              |

### Capture once, share across N workers

```ts
// In a global setup / Playwright globalSetup hook:
const manager = new AuthManager(new StorageStateAuthProvider(myAuthHook));

// Called once per worker context — authenticate runs only on the first call.
await manager.hydrate(workerContext1); // → authenticate() called, state cached
await manager.hydrate(workerContext2); // → cache hit; authenticate() NOT called again
await manager.hydrate(workerContext3); // → cache hit; authenticate() NOT called again

console.log(manager.state?.cookies?.length); // → 1 (shared session cookie)
```

If the session expires between calls (i.e. `provider.isValid(state)` returns `false`), `AuthManager` automatically re-authenticates and updates the cache.

## Development

```bash
# Build
npm run build -w @rippleview/core

# Test
npm run test -w @rippleview/core

# Lint
npm run lint -w @rippleview/core
```
