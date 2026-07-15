import { dirname, basename, join } from 'node:path';
import { existsSync } from 'node:fs';
import {
  loadAppConfig,
  loadWorkspaceConfig,
  buildRunContext,
  WorkspaceConfigSchema,
  discoverSuites,
} from '@rippleview/core';
import type { EngineExecutor } from '@rippleview/core';
import { playwrightEngineExecutor } from '@rippleview/plugin-playwright';
import type { SummaryRecord } from '../summary.js';
import { writeSummary as defaultWriteSummary } from '../summary.js';
import { runAllSuites } from './runSuites.js';
import { buildResultsRecord, writeResults, formatRunTable } from './runReport.js';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RunOptions {
  /** Absolute or relative path to the app `rippleview.config.yaml`. */
  config: string;
  /** Directory where `summary.json` is written. Defaults to `process.cwd()`. */
  output?: string;
  /** Environment overrides forwarded to config loaders. Defaults to `process.env`. */
  env?: Record<string, string | undefined>;
  /**
   * Injectable writer — receives the record and output dir.
   * Defaults to the real `writeSummary` from `../summary.js`.
   */
  writeSummary?: (record: SummaryRecord, outputDir: string) => void;
  /** Injectable mkdir — called before writing the summary. No-op by default. */
  mkdirp?: (dir: string) => void;
  /**
   * Injectable suite discoverer — defaults to the real `discoverSuites`
   * ( Decision 3: globs `*.feature` co-located with `rippleview.config.yaml`).
   * Overridable so `runCommand` itself stays testable without touching disk.
   */
  discoverSuites?: (appConfigDir: string) => Promise<ReturnType<typeof discoverSuites>>;
  /**
   * Injectable EngineExecutor — defaults to the real `playwrightEngineExecutor`
   * ( AC1/AC2: launches a real browser per matrix entry, fresh context
   * per scenario). Overridable so `runCommand` itself stays testable without
   * spinning up a real browser unless a test explicitly wants one.
   */
  executor?: EngineExecutor;
}

export interface RunResult {
  exitCode: number;
  summary: SummaryRecord;
}

// ── Workspace config discovery ────────────────────────────────────────────────

const WORKSPACE_FILE = 'rippleview.workspace.yaml';

/**
 * Walk parent directories from `startDir` looking for `rippleview.workspace.yaml`.
 * Returns the first path found, or `null` if the filesystem root is reached.
 */
function findWorkspaceConfig(startDir: string): string | null {
  let current = startDir;
  while (true) {
    const candidate = join(current, WORKSPACE_FILE);
    if (existsSync(candidate)) {
      return candidate;
    }
    const parent = dirname(current);
    if (parent === current) {
      // Reached the filesystem root.
      return null;
    }
    current = parent;
  }
}

// ── runCommand ────────────────────────────────────────────────────────────────

/**
 * Load config, build a RunContext, discover this app's own `.feature`
 * suites ( Decision 3) and run every scenario for real against the
 * app's configured browser matrix (AC1/AC2/AC4), then write summary.json.
 *
 * Never throws — all errors are caught and returned as `{ exitCode: 1 }`.
 * This satisfies G10 (findings are data) and G7 (exit code is the CI contract).
 */
export async function runCommand(opts: RunOptions): Promise<RunResult> {
  const startMs = Date.now();
  const outputDir = opts.output ?? process.cwd();
  const env = opts.env ?? process.env;
  const writeSum = opts.writeSummary ?? defaultWriteSummary;
  const mkdirp = opts.mkdirp;

  const fail = (tenant: string, findings: unknown[] = []): RunResult => {
    const summary: SummaryRecord = {
      tenant,
      verdict: 'fail',
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startMs,
      findings,
    };
    try {
      mkdirp?.(outputDir);
      writeSum(summary, outputDir);
    } catch {
      // Swallow write errors — the exit code still signals failure.
    }
    return { exitCode: 1, summary };
  };

  let appConfig;
  try {
    appConfig = loadAppConfig(opts.config, env);
  } catch (err) {
    return fail('unknown', [String(err instanceof Error ? err.message : err)]);
  }

  // Derive appName from the config file path (the directory name of the config file).
  const appName = basename(dirname(opts.config));

  // Discover workspace config by walking up from the app config directory.
  const appDir = dirname(opts.config);
  const workspaceConfigPath = findWorkspaceConfig(appDir);

  let workspaceConfig;
  if (workspaceConfigPath !== null) {
    try {
      workspaceConfig = loadWorkspaceConfig(workspaceConfigPath, env);
    } catch {
      // Fall back to minimal workspace config — do not fail the run (skeleton stage).
      workspaceConfig = WorkspaceConfigSchema.parse({ version: '1', name: 'unknown' });
    }
  } else {
    workspaceConfig = WorkspaceConfigSchema.parse({ version: '1', name: 'unknown' });
  }

  const resolvedWorkspacePath = workspaceConfigPath ?? join(appDir, WORKSPACE_FILE);

  let context;
  try {
    context = buildRunContext({
      workspaceConfig,
      appConfig,
      appName,
      paths: {
        workspace: resolvedWorkspacePath,
        app: opts.config,
        output: outputDir,
      },
    });
  } catch (err) {
    return fail('unknown', [String(err instanceof Error ? err.message : err)]);
  }

  // ── AC4: discover this app's own .feature suites and run every
  // scenario for real against its configured browser matrix ─────────────────
  const discover = opts.discoverSuites ?? discoverSuites;
  const executor = opts.executor ?? playwrightEngineExecutor;

  let outcome;
  try {
    const suites = await discover(appDir);
    outcome = await runAllSuites(suites, appConfig.matrix, executor, {
      baseUrl: appConfig.baseUrl,
    });
  } catch (err) {
    return fail(context.tenant, [String(err instanceof Error ? err.message : err)]);
  }

  const timestamp = new Date().toISOString();
  const durationMs = Date.now() - startMs;

  const summary: SummaryRecord = {
    tenant: context.tenant,
    verdict: outcome.verdict,
    timestamp,
    durationMs,
    findings: outcome.findings as unknown[],
  };

  try {
    mkdirp?.(outputDir);
    writeSum(summary, outputDir);
  } catch (err) {
    // Write failure does not change the verdict — log to stderr and continue.
    process.stderr.write(
      `Warning: failed to write summary.json — ${String(err instanceof Error ? err.message : err)}\n`,
    );
  }

  // Detailed reporting — results.json (machine) + console table (human).
  // Additive to summary.json (G5); best-effort, never changes the verdict.
  const results = buildResultsRecord(
    context.tenant,
    outcome.verdict,
    timestamp,
    durationMs,
    outcome.results,
  );
  try {
    writeResults(results, outputDir);
  } catch (err) {
    process.stderr.write(
      `Warning: failed to write results.json — ${String(err instanceof Error ? err.message : err)}\n`,
    );
  }
  process.stdout.write(formatRunTable(results));

  return { exitCode: summary.verdict === 'pass' ? 0 : 1, summary };
}
