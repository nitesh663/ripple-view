import { dirname, basename, join } from 'node:path';
import { existsSync } from 'node:fs';
import {
  createBundle,
  createBundleStore,
  realWalk,
  realReadFile,
  realZipFactory,
  loadWorkspaceConfig,
  WorkspaceConfigSchema,
  type BundleManifest,
} from '@rippleview/core';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BundleOptions {
  /** Absolute or relative path to the consumer app directory to bundle. */
  app: string;
  /** Bundle name; defaults to basename(app) when omitted. */
  name?: string;
  /** Path to rippleview.workspace.yaml; if omitted, discovered by walking up from `app`. */
  workspace?: string;
  /** Environment overrides forwarded to the workspace config loader. Defaults to process.env. */
  env?: Record<string, string | undefined>;
}

export interface BundleCommandResult {
  exitCode: number;
  manifest?: BundleManifest;
}

// ── Workspace config discovery ────────────────────────────────────────────────
// Mirrors run.ts's findWorkspaceConfig — kept local since each command owns
// its own small discovery concern (see run.ts precedent).

const WORKSPACE_FILE = 'rippleview.workspace.yaml';

function findWorkspaceConfig(startDir: string): string | null {
  let current = startDir;
  while (true) {
    const candidate = join(current, WORKSPACE_FILE);
    if (existsSync(candidate)) {
      return candidate;
    }
    const parent = dirname(current);
    if (parent === current) {
      return null;
    }
    current = parent;
  }
}

const FALLBACK_BUNDLE_STORE = {
  profile: 'local-zip' as const,
  localZip: { storeDir: '.rv/bundles' },
};

// ── bundleCommand ────────────────────────────────────────────────────────────

/**
 * Pack the consumer app at `opts.app` (AC-1) and push it to the configured
 * BundleStore (AC-2/AC-3).
 *
 * Never throws — all errors are caught and returned as `{ exitCode: 1 }`.
 * This satisfies G10 (failures are data) and G7 (exit code is the CI contract).
 */
export async function bundleCommand(opts: BundleOptions): Promise<BundleCommandResult> {
  const env = opts.env ?? process.env;

  if (!existsSync(opts.app)) {
    process.stderr.write(`rv bundle: app directory not found: ${opts.app}\n`);
    return { exitCode: 1 };
  }

  const appName = opts.name ?? basename(opts.app);

  const workspaceConfigPath = opts.workspace ?? findWorkspaceConfig(opts.app);

  let bundleStoreConfig = FALLBACK_BUNDLE_STORE;
  if (workspaceConfigPath !== null && workspaceConfigPath !== undefined) {
    try {
      const workspaceConfig = loadWorkspaceConfig(workspaceConfigPath, env);
      bundleStoreConfig = workspaceConfig.bundleStore;
    } catch (err) {
      process.stderr.write(
        `rv bundle: failed to load workspace config at ${workspaceConfigPath}, falling back to default local-zip store — ${String(err instanceof Error ? err.message : err)}\n`,
      );
    }
  } else {
    // PoC must run with zero external dependency — bundling one app must not
    // require a workspace file. Surface a warning so the fallback is not silent.
    process.stderr.write(
      'rv bundle: no rippleview.workspace.yaml found — falling back to default local-zip BundleStore\n',
    );
    bundleStoreConfig = WorkspaceConfigSchema.parse({ version: '1', name: 'unknown' }).bundleStore;
  }

  try {
    const { manifest, archive } = createBundle({
      appName,
      appDir: opts.app,
      walk: realWalk,
      readFile: realReadFile,
      zipFactory: realZipFactory,
    });

    const store = createBundleStore(bundleStoreConfig);
    await store.putBundle(appName, archive, manifest);

    process.stdout.write(`${JSON.stringify(manifest, null, 2)}\n`);
    return { exitCode: 0, manifest };
  } catch (err) {
    process.stderr.write(
      `rv bundle: failed to bundle ${appName} — ${String(err instanceof Error ? err.message : err)}\n`,
    );
    return { exitCode: 1 };
  }
}
