import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadWorkspaceConfig } from '@rippleview/core';
import { scanRegistry, type RegistryDocument } from '@rippleview/registry';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RegistryScanOptions {
  /** Path to rippleview.workspace.yaml — its `packages` field is the tracked-package list. */
  workspace: string;
  /** One or more repo/workspace root directories to scan. Defaults to the workspace file's own directory. */
  roots?: string[];
  /** Directory where `registry.json` is written. Defaults to `process.cwd()`. */
  output?: string;
  /**
   * `on-demand` (default) overwrites registry.json in place. `nightly`
   * additionally writes a timestamped snapshot alongside it, for trend
   * history — T-6.1.3. Scanning logic itself is identical in both modes;
   * only the output footprint differs.
   */
  mode?: 'on-demand' | 'nightly';
  /** Environment overrides forwarded to config loaders. Defaults to `process.env`. */
  env?: Record<string, string | undefined>;
  /** Injectable writer — defaults to `fs.writeFileSync`. */
  writeFile?: (path: string, content: string) => void;
}

export interface RegistryScanResult {
  exitCode: number;
  registry?: RegistryDocument;
}

function defaultWriteFile(path: string, content: string): void {
  writeFileSync(path, content, 'utf8');
}

// ── registryScanCommand ───────────────────────────────────────────────────────

/**
 * Load the workspace config, scan its tracked packages across one or more
 * repo roots, and write registry.json (RippleView_DESIGN.md).
 *
 * Never throws — all errors are caught and returned as `{ exitCode: 1 }`
 * (G7/G10: exit code is the CI contract, failures are data, not a crash).
 */
export async function registryScanCommand(opts: RegistryScanOptions): Promise<RegistryScanResult> {
  const env = opts.env ?? process.env;
  const outputDir = opts.output ?? process.cwd();
  const writeFile = opts.writeFile ?? defaultWriteFile;
  const mode = opts.mode ?? 'on-demand';

  let workspaceConfig;
  try {
    workspaceConfig = loadWorkspaceConfig(opts.workspace, env);
  } catch {
    return { exitCode: 1 };
  }

  const roots = opts.roots ?? [join(opts.workspace, '..')];

  let registry: RegistryDocument;
  try {
    registry = scanRegistry({ roots, trackedPackages: workspaceConfig.packages });
  } catch {
    return { exitCode: 1 };
  }

  const json = JSON.stringify(registry, null, 2);

  try {
    writeFile(join(outputDir, 'registry.json'), json);
    if (mode === 'nightly') {
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      writeFile(join(outputDir, `registry.${stamp}.json`), json);
    }
  } catch {
    // Write failure does not change the scan result — the registry was
    // still computed correctly; only persistence failed.
    return { exitCode: 1, registry };
  }

  return { exitCode: 0, registry };
}
