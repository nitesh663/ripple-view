import { z } from 'zod';

// ── Workspace config schema ─────────────────────────────────────────────────
// Corresponds to rippleview.workspace.yaml at the repo root.

export const WorkspaceConfigSchema = z.object({
  version: z.string(),
  name: z.string(),
  packages: z.array(z.string()).default([]),
  settings: z
    .object({
      strict: z.boolean().default(false),
    })
    .default({}),
  // where `rv bundle` pushes/pulls content-addressed consumer
  // bundles. Workspace-level (shared across apps), optional with defaults
  // so existing workspace configs parse unchanged. Switching `profile` from
  // 'local-zip' (PoC) to 'oci' (prod) is the entire migration — no consumer
  // app changes (AC-2).
  bundleStore: z
    .object({
      profile: z.enum(['local-zip', 'oci']).default('local-zip'),
      localZip: z
        .object({
          storeDir: z.string().default('.rv/bundles'),
        })
        .default({}),
      oci: z
        .object({
          registry: z.string().optional(),
          repository: z.string().optional(),
        })
        .optional(),
    })
    .default({}),
});

export type WorkspaceConfig = z.infer<typeof WorkspaceConfigSchema>;

// ── App config schema ────────────────────────────────────────────────────────
// Corresponds to apps/<app>/rippleview.config.yaml.

export const AppConfigSchema = z.object({
  // AC-3: absent department defaults to 'default'
  department: z.string().default('default'),
  //  AC1/AC4: the served app's origin the real EngineExecutor
  // navigates to before a scenario's first `navigate` step (G9: a
  // production build served by nginx/vite-preview, never a dev server).
  // Required — the AI Implementation Context Pack's canonical config shape
  // specifies this field, and every real rippleview.config.yaml already has it
  // (e.g. "http://app:8080"); a config missing it cannot be run for real.
  baseUrl: z.string(),
  hooks: z
    .object({
      auth: z.string().optional(),
      seed: z.string().optional(),
      teardown: z.string().optional(),
    })
    .default({}),
  matrix: z
    .array(
      z.object({
        browser: z.string(),
        viewport: z.object({ width: z.number(), height: z.number() }),
      }),
    )
    .default([]),
  visual: z
    .object({
      threshold: z.number().min(0).max(1).default(0.01),
    })
    .default({}),
  sceneProvider: z.string().optional(),
  //: the consumer's app-runtime build contract. The whole block
  // is optional so existing configs that omit it parse unchanged; when present
  // the orchestrator passes these as --build-arg's to docker/app-runtime/Dockerfile.
  build: z
    .object({
      /** concrete Docker tag fragment, e.g. "18" or "20.11.0" (never a range) */
      node: z.string().optional(),
      /** build command, e.g. "ng build" / "react-scripts build" / "vite build" */
      command: z.string().optional(),
      /** built artifact directory, e.g. "dist", "build", "dist/app/browser" */
      outputDir: z.string().optional(),
      /** serve mode: static (nginx) or node (production node server) */
      serve: z.enum(['static', 'node']).optional(),
      /** node serve-mode start command, e.g. "node server.js" */
      start: z.string().optional(),
      /** node serve-mode listen port */
      port: z.number().optional(),
    })
    .optional(),
});

export type AppConfig = z.infer<typeof AppConfigSchema>;

// ── Run context schema ────────────────────────────────────────────────────────
// Produced by buildRunContext after merging workspace + app configs.

export const RunContextSchema = z.object({
  /** workspace.name + ':' + appName */
  tenant: z.string(),
  appName: z.string(),
  department: z.string(),
  paths: z.object({
    /** Absolute path to the workspace config file */
    workspace: z.string(),
    /** Absolute path to the app config file */
    app: z.string(),
    /** Directory where run results are written */
    output: z.string(),
  }),
  workspace: WorkspaceConfigSchema,
  app: AppConfigSchema,
});

export type RunContext = z.infer<typeof RunContextSchema>;
