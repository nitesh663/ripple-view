import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { copyAppToTmp } from './copyAppToTmp.js';
import type { GateSummaryRecord } from './gateSummary.js';
import { writeSummary as defaultWriteSummary } from '../summary.js';
import {
  realExecutor,
  realIdGen,
  realReadFileFn,
  realExistsFn,
  realReadFileWithEncodingFn,
  realWriteFileWithEncodingFn,
  realFrameworkRoot,
  resolveBuildContract,
  buildAppRuntime,
  injectOverride,
  generateComposeYaml,
  runIsolationUnit,
  type GateDeps,
} from './gateDeps.js';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GateOptions {
  /** Only `--local` is supported in this story (); see. */
  local: boolean;
  /** Consumer app directory already on disk (BundleStore wiring is a sibling story's scope). */
  app: string;
  package?: string;
  version?: string;
  output?: string;
  env?: Record<string, string | undefined>;
  /** Injectable dependency bundle — defaults to the real implementations. */
  deps?: Partial<GateDeps>;
}

export interface GateCommandResult {
  exitCode: number;
  status?: 'passed' | 'failed' | 'errored';
}

const defaultDeps: GateDeps = {
  existsFn: realExistsFn,
  readFileFn: realReadFileFn,
  readFileWithEncodingFn: realReadFileWithEncodingFn,
  writeFileWithEncodingFn: realWriteFileWithEncodingFn,
  writeFileFn: (path, content) => realWriteFileWithEncodingFn(path, content, 'utf8'),
  executor: realExecutor,
  idGen: realIdGen,
  resolveBuildContract,
  buildAppRuntime,
  injectOverride,
  generateComposeYaml,
  runIsolationUnit,
  copyAppToTmp,
  mkdirp: (dir: string) => mkdirSync(dir, { recursive: true }),
  cleanupTmp: (dir: string) => rmSync(dir, { recursive: true, force: true }),
  frameworkRoot: realFrameworkRoot,
};

// ── gateCommand ──────────────────────────────────────────────────────────────

/**
 * Runs one isolation-unit gate against an app directory already on disk
 * (T-5.3.2). Never throws — all errors are caught and returned as
 * `{ exitCode: 1 }` (G7/G10).
 */
export async function gateCommand(opts: GateOptions): Promise<GateCommandResult> {
  const deps: GateDeps = { ...defaultDeps, ...opts.deps };

  try {
    return await runGate(opts, deps);
  } catch (err) {
    process.stderr.write(
      `rv gate: unexpected failure — ${String(err instanceof Error ? err.message : err)}\n`,
    );
    return { exitCode: 1 };
  }
}

async function runGate(opts: GateOptions, deps: GateDeps): Promise<GateCommandResult> {
  if (!opts.local) {
    process.stderr.write(
      'rv gate: only --local is implemented in this story (); the ' +
        'in-process<->service control-plane split is  and is out of scope here.\n',
    );
    return { exitCode: 1 };
  }

  if (!existsSync(opts.app)) {
    process.stderr.write(`rv gate: app directory not found: ${opts.app}\n`);
    return { exitCode: 1 };
  }

  const outputDir = opts.output ?? process.cwd();
  const startMs = Date.now();
  const appCopyDir = deps.copyAppToTmp(opts.app);

  // The temp copy (and the compose/results files generated alongside it)
  // must be removed once the gate is done, on every path — success, build
  // failure, or isolation-unit failure/error — or every run leaks a full
  // copy of the consumer's app + build artifacts under the OS temp dir.
  try {
    if (opts.package !== undefined && opts.version !== undefined) {
      deps.injectOverride({
        appDir: appCopyDir,
        packageName: opts.package,
        versionSpec: opts.version,
        readFileFn: deps.readFileWithEncodingFn,
        writeFileFn: deps.writeFileWithEncodingFn,
        existsFn: deps.existsFn,
      });
    }

    const buildResult = buildWithOneRetry(appCopyDir, deps);
    if (!buildResult.ok) {
      const summary = buildGateSummary({
        status: 'errored',
        startMs,
        findings: [buildResult.finding],
      });
      persistSummary(summary, outputDir, deps);
      return { exitCode: 1, status: 'errored' };
    }

    const composeFilePath = join(appCopyDir, '..', 'docker-compose.yml');
    const resultsDir = join(appCopyDir, '..', 'results');
    deps.mkdirp(resultsDir);
    deps.writeFileFn(
      composeFilePath,
      deps.generateComposeYaml({
        appImageTag: buildResult.imageTag,
        runnerImageTag: 'rv-runner:0.0.0',
        appHostDir: appCopyDir,
        resultsHostDir: resultsDir,
      }),
    );

    const unit = deps.runIsolationUnit({
      composeFilePath,
      projectName: `rv-gate-${Date.now()}`,
      executor: deps.executor,
      resultsDir,
      idGen: deps.idGen,
      readFileFn: deps.readFileFn,
      existsFn: deps.existsFn,
    });

    const summary = buildGateSummary({ status: unit.status, startMs, findings: unit.findings });
    persistSummary(summary, outputDir, deps);

    return { exitCode: unit.status === 'passed' ? 0 : 1, status: unit.status };
  } finally {
    deps.cleanupTmp(dirname(appCopyDir));
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Builds the app-runtime image, retrying once on a transient failure
 * (the design spec: "Verdaccio/registry down" row) before accepting it as a
 * final build-failure finding. Does not retry indefinitely.
 */
function buildWithOneRetry(appDir: string, deps: GateDeps): ReturnType<typeof buildAppRuntime> {
  const contract = deps.resolveBuildContract({
    appDir,
    readFileFn: deps.readFileFn,
    existsFn: deps.existsFn,
  });
  const attempt = (): ReturnType<typeof buildAppRuntime> =>
    deps.buildAppRuntime({
      contract,
      imageTag: `app-runtime:${Date.now()}`,
      dockerfilePath: join(deps.frameworkRoot, 'docker/app-runtime/Dockerfile'),
      appDir,
      frameworkRoot: deps.frameworkRoot,
      executor: deps.executor,
      idGen: deps.idGen,
    });

  const first = attempt();
  return first.ok ? first : attempt();
}

function buildGateSummary(args: {
  status: 'passed' | 'failed' | 'errored';
  startMs: number;
  findings: unknown[];
}): GateSummaryRecord {
  return {
    status: args.status,
    timestamp: new Date().toISOString(),
    durationMs: Date.now() - args.startMs,
    findings: args.findings,
  };
}

function persistSummary(summary: GateSummaryRecord, outputDir: string, deps: GateDeps): void {
  try {
    deps.mkdirp(outputDir);
    defaultWriteSummary(summary, outputDir, deps.writeFileFn);
  } catch (err) {
    process.stderr.write(
      `Warning: failed to write summary.json — ${String(err instanceof Error ? err.message : err)}\n`,
    );
  }
}
