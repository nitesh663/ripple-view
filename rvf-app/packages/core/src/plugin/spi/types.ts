// ── Supporting types ──────────────────────────────────────────────────────────

export interface Scene {
  id: string;
  name: string;
  url?: string;
}

export interface Capture {
  sceneId: string;
  timestamp: string;
  viewport: { width: number; height: number };
  screenshotPath?: string;
}

/** G12: multi-signal verdict — category + severity + valueDelta all required on DiffSignal results */
export interface SignalResult {
  name: string;
  category: 'visual' | 'layout' | 'style' | 'value';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  /** Optional numeric delta between baseline and current. G12: used by multi-signal verdict. */
  valueDelta?: number;
  passed: boolean;
}

/** G17: confidence is an honest blend 0-1; never rounded up to force a green gate */
export interface GateDecision {
  tenant: string;
  verdict: 'pass' | 'fail';
  /** G17: 0-1, never rounded up */
  confidence: number;
  timestamp: string;
}

export interface RegistryMetadata {
  packageName: string;
  version: string;
  framework: string;
  peerDependencies: Record<string, string>;
}

// ── SPI interfaces ────────────────────────────────────────────────────────────
// Source of truth: Plugin SPI & Adapter Authoring (the design spec)
// 

/**
 * Enumerate and render the scenes (pages/stories/routes) to validate.
 *
 * G11: one SceneProvider per framework/tool — implement this interface in a plugin,
 *      never fork core.
 * G13: implementations must wait on stable signals, never fixed sleeps.
 */
export interface SceneProvider {
  readonly name: string;
  listScenes(): Promise<Scene[]>;
  /**
   * Render a single scene onto the given page.
   * `page` is typed `unknown` to keep core agnostic (G1); impls cast to their
   * framework type (e.g. `page as Page` in a Playwright adapter).
   */
  renderScene(scene: Scene, page: unknown): Promise<void>;
}

/**
 * Drive a component through its states via ARIA-role-based play functions.
 *
 * G2: locators must be A11y-tree only (role + accessible name).
 */
export interface StateProbe {
  readonly name: string;
  probe(ctx: { scene: Scene; page: unknown }): Promise<void>;
}

/**
 * Contribute one signal (geometry / computed-style / pixel / value-delta) to the
 * multi-signal verdict.
 *
 * G12: category + severity + valueDelta required in the returned SignalResult.
 */
export interface DiffSignal {
  readonly name: string;
  compare(baseline: Capture, current: Capture): Promise<SignalResult>;
}

/**
 * Store and retrieve visual baselines.
 *
 * G5: same document shape across PoC (folder) and prod (S3) implementations —
 *     field names are a contract, never rename to fit a store.
 */
export interface BaselineStore {
  putBaseline(sceneId: string, capture: Capture): Promise<void>;
  getBaseline(sceneId: string): Promise<Capture | undefined>;
}

/**
 * Provide knowledge registry metadata derived from package.json.
 *
 * G11: swappable without forking core.
 */
export interface RegistrySource {
  readonly name: string;
  listPackages(): Promise<RegistryMetadata[]>;
}

/**
 * Emit gate outcomes to SCM / Slack / an issue tracker.
 *
 * G7: core stays CI-neutral; concrete targets (GitHub, GitLab, etc.) live in plugins.
 */
export interface Notifier {
  readonly name: string;
  notify(decision: GateDecision): Promise<void>;
}

/**
 * Resolve secrets from vault → env → .npmrc (G18).
 *
 * G18: never commit or log resolved secrets; redact PII in screenshots/network.
 */
export interface SecretsProvider {
  readonly name: string;
  getSecret(key: string): Promise<string | undefined>;
}

/**
 * Container returned by a plugin factory function.
 *
 * A plugin declares the SPI major version it targets; core rejects mismatches (G16).
 * A plugin may implement one or more SPI interfaces; unused slots are simply absent.
 *
 * G11: all extension goes through this factory path — never a fork of core.
 * G16: spiVersion must equal core's SPI_VERSION; a breaking SPI change requires a
 *      core major version bump.
 */
export interface RippleViewPlugin {
  /** SPI major version this plugin targets. Must equal core's SPI_VERSION. */
  readonly spiVersion: number;
  readonly name: string;
  sceneProvider?: SceneProvider;
  stateProbe?: StateProbe;
  diffSignal?: DiffSignal;
  baselineStore?: BaselineStore;
  registrySource?: RegistrySource;
  notifier?: Notifier;
  secretsProvider?: SecretsProvider;
}
