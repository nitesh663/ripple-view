import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { resolveBuildContract } from '../../../../scripts/resolve-build-contract.mjs';
import { buildAppRuntime } from '../../../../scripts/build-app-runtime.mjs';
import { injectOverride } from '../../../../scripts/inject-override.js';
import { generateComposeYaml } from '../../../../scripts/generate-compose.mjs';
import { runIsolationUnit } from '../../../../scripts/run-isolation-unit.mjs';

// gateDeps.ts — the real, I/O-performing implementations of every dependency
// `gateCommand` needs (T-5.3.2). Collected in one place so the
// command function itself can take a single `GateDeps` injection seam for
// tests (mirrors run.ts's injectable `writeSummary`/`mkdirp`, scaled up to a
// whole dependency bundle since `gate` orchestrates several root scripts/*
// utilities rather than one).
//
// The relative imports into root `scripts/*` are intentional: `packages/cli`
// is allowed to invoke root build/orchestration utilities (see  story
// notes) — `@rippleview/core` itself never does this (G1/G19 stay intact).

/** Real `docker`/`docker compose` executor — argv array only, never a shell string (G8). */
export function realExecutor(command: string, args: string[]): unknown {
  return execFileSync(command, args, { stdio: 'pipe', encoding: 'utf8' });
}

export const realIdGen = (): string => randomUUID();

/**
 * Walks up from `startDir` looking for `package-lock.json` — the rv
 * repo's own root marker. Walking from this file's own on-disk location
 * (rather than hardcoding a fixed `../..` depth) stays correct whether this
 * runs from TypeScript source (tests) or the tsup-bundled dist/ output,
 * where the file's nesting depth differs.
 */
function findRepoRoot(startDir: string): string {
  let current = startDir;
  while (true) {
    if (existsSync(join(current, 'package-lock.json'))) {
      return current;
    }
    const parent = dirname(current);
    if (parent === current) {
      throw new Error(
        `Could not locate the rv repo root (package-lock.json) above ${startDir}`,
      );
    }
    current = parent;
  }
}

/**
 * Absolute path to the rv repo root. `buildAppRuntime` needs this as
 * `frameworkRoot` so the app-runtime Dockerfile can pull its own files (e.g.
 * nginx.conf) from a secondary build context — the primary context is a
 * throwaway copy of the CONSUMER's app and never contains RippleView's own files.
 */
export const realFrameworkRoot = findRepoRoot(dirname(fileURLToPath(import.meta.url)));

/** Plain `(path) => string` reader — what resolveBuildContract/runIsolationUnit expect. */
export const realReadFileFn = (path: string): string => readFileSync(path, 'utf8');
export const realExistsFn = (path: string): boolean => existsSync(path);

/** `(path, encoding) => string` reader — what injectOverride expects. */
export const realReadFileWithEncodingFn = (path: string, encoding: 'utf8'): string =>
  readFileSync(path, encoding);
/** `(path, content, encoding) => void` writer — what injectOverride expects. */
export const realWriteFileWithEncodingFn = (
  path: string,
  content: string,
  encoding: 'utf8',
): void => {
  writeFileSync(path, content, encoding);
};

export {
  resolveBuildContract,
  buildAppRuntime,
  injectOverride,
  generateComposeYaml,
  runIsolationUnit,
};

/** The full dependency surface `gateCommand` needs, injectable for tests. */
export interface GateDeps {
  existsFn: typeof realExistsFn;
  readFileFn: typeof realReadFileFn;
  readFileWithEncodingFn: typeof realReadFileWithEncodingFn;
  writeFileWithEncodingFn: typeof realWriteFileWithEncodingFn;
  /** Plain `(path, content) => void` writer — used for the compose file and summary.json. */
  writeFileFn: (path: string, content: string) => void;
  executor: typeof realExecutor;
  idGen: () => string;
  resolveBuildContract: typeof resolveBuildContract;
  buildAppRuntime: typeof buildAppRuntime;
  injectOverride: typeof injectOverride;
  generateComposeYaml: typeof generateComposeYaml;
  runIsolationUnit: typeof runIsolationUnit;
  copyAppToTmp: (srcDir: string) => string;
  mkdirp: (dir: string) => void;
  /** Removes the temp dir tree created by `copyAppToTmp`, always run in a `finally` (G10 hygiene). */
  cleanupTmp: (dir: string) => void;
  /** Absolute rv repo root, passed to `buildAppRuntime` as `frameworkRoot`. */
  frameworkRoot: string;
}
