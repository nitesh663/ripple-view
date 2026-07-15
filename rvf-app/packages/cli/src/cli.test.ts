import { describe, it, expect, beforeAll } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { program, VERSION } from './index.js';
import { runCommand } from './commands/run.js';
import { stubCommand } from './commands/stubs.js';
import type { SummaryRecord } from './summary.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** No-op writer injected into runCommand so tests never touch the real FS output. */
const noopWriter: (record: SummaryRecord, outputDir: string) => void = () => undefined;

/** No-op mkdirp injected into runCommand so tests never create real directories. */
const noopMkdirp: (dir: string) => void = () => undefined;

// Minimal valid app config YAML.
const VALID_APP_YAML = `
department: testing
baseUrl: "http://localhost:4999"
visual:
  threshold: 0.01
`;

let validConfigPath: string;

beforeAll(() => {
  // Create a temp directory with a valid rippleview.config.yaml for integration-style tests.
  // This is deterministic (G13): the content is fixed; no network, no animations.
  const tempDir = join(tmpdir(), `rv-cli-test-${process.pid}`);
  const appDir = join(tempDir, 'my-app');
  mkdirSync(appDir, { recursive: true });
  validConfigPath = join(appDir, 'rippleview.config.yaml');
  writeFileSync(validConfigPath, VALID_APP_YAML, 'utf8');
});

// ── AC-2: all 7 commands registered ──────────────────────────────────────────

describe('AC-2: program registers all required commands', () => {
  it('registers all 7 required commands', () => {
    const names = program.commands.map((c) => c.name());
    expect(names).toContain('run');
    expect(names).toContain('gate');
    expect(names).toContain('crawl');
    expect(names).toContain('scan');
    expect(names).toContain('baseline');
    expect(names).toContain('report');
    expect(names).toContain('init');
  });

  it('rv --help output lists all commands', () => {
    // Verify descriptions are present without spawning a subprocess.
    const helpText = program.helpInformation();
    expect(helpText).toContain('run');
    expect(helpText).toContain('gate');
    expect(helpText).toContain('crawl');
    expect(helpText).toContain('scan');
    expect(helpText).toContain('baseline');
    expect(helpText).toContain('report');
    expect(helpText).toContain('init');
  });
});

// ── AC-1: run exits 0 on valid config ────────────────────────────────────────

describe('AC-1: runCommand exit codes', () => {
  it('exits 0 when config file is valid', async () => {
    const result = await runCommand({
      config: validConfigPath,
      writeSummary: noopWriter,
      mkdirp: noopMkdirp,
    });
    expect(result.exitCode).toBe(0);
  });

  it('exits 1 when config path does not exist', async () => {
    const result = await runCommand({
      config: '/nonexistent/rippleview.config.yaml',
      writeSummary: noopWriter,
      mkdirp: noopMkdirp,
    });
    expect(result.exitCode).toBe(1);
  });

  it('exits 1 when config YAML is malformed', async () => {
    const tempDir = join(tmpdir(), `rv-cli-bad-${process.pid}`);
    mkdirSync(tempDir, { recursive: true });
    const badConfig = join(tempDir, 'rippleview.config.yaml');
    // Invalid YAML that will fail schema validation.
    writeFileSync(badConfig, 'matrix: not-an-array\n', 'utf8');
    const result = await runCommand({
      config: badConfig,
      writeSummary: noopWriter,
      mkdirp: noopMkdirp,
    });
    expect(result.exitCode).toBe(1);
  });
});

// ── T-1.2.3: summary shape ────────────────────────────────────────────────────

describe('T-1.2.3: summary.json shape', () => {
  it('emits a SummaryRecord with required fields on successful run', async () => {
    let capturedSummary: SummaryRecord | undefined;
    const captureWriter = (record: SummaryRecord): void => {
      capturedSummary = record;
    };

    await runCommand({
      config: validConfigPath,
      writeSummary: captureWriter,
      mkdirp: noopMkdirp,
    });

    expect(capturedSummary).toBeDefined();
    expect(capturedSummary?.verdict).toBe('pass');
    expect(typeof capturedSummary?.tenant).toBe('string');
    expect(typeof capturedSummary?.timestamp).toBe('string');
    expect(typeof capturedSummary?.durationMs).toBe('number');
    expect(Array.isArray(capturedSummary?.findings)).toBe(true);
  });

  it('emits verdict:fail summary on invalid config path', async () => {
    let capturedSummary: SummaryRecord | undefined;
    const captureWriter = (record: SummaryRecord): void => {
      capturedSummary = record;
    };

    await runCommand({
      config: '/nonexistent/rippleview.config.yaml',
      writeSummary: captureWriter,
      mkdirp: noopMkdirp,
    });

    expect(capturedSummary?.verdict).toBe('fail');
  });

  it('tenant is a non-empty string', async () => {
    let capturedSummary: SummaryRecord | undefined;
    const captureWriter = (record: SummaryRecord): void => {
      capturedSummary = record;
    };

    await runCommand({
      config: validConfigPath,
      writeSummary: captureWriter,
      mkdirp: noopMkdirp,
    });

    expect(typeof capturedSummary?.tenant).toBe('string');
    expect((capturedSummary?.tenant ?? '').length).toBeGreaterThan(0);
  });
});

// ── T-1.2.2: stub commands ───────────────────────────────────────────────────

describe('T-1.2.2: stub commands return exitCode 1', () => {
  const stubNames = ['crawl', 'scan', 'baseline', 'report', 'init'] as const;

  for (const name of stubNames) {
    it(`stubCommand("${name}") returns exitCode 1`, () => {
      const result = stubCommand(name);
      expect(result.exitCode).toBe(1);
      expect(result.message).toContain(name);
    });
  }
});

// ── regression: a subcommand option must never collide with the ────
// CLI's own reserved `--version` flag ──────────────────────────────────────
//
// Found as a real, pre-existing bug while wiring 's `tests
// check-lockstep` command: Commander's `.version(VERSION)` on the root
// `program` intercepts a bare `--version` ANYWHERE in argv, regardless of
// which subcommand it's nested under — it prints "0.0.0" and exits 0,
// silently swallowing the subcommand's own option. `gate`'s pre-existing
// `--version <spec>` had this exact bug, completely undetected, because
// every other test in this file calls the command FUNCTIONS directly
// (`gateCommand()`), never exercising real Commander argv parsing.
//
// These tests close that blind spot by spawning the REAL built CLI binary
// as a real subprocess (execFileSync against dist/cli.js) — Commander's
// `program` is a long-lived module-level singleton, and repeatedly calling
// `program.parseAsync()` in-process (even with `process.exit` mocked)
// leaves stateful side effects across calls that made an earlier draft of
// this test flaky/noisy. A real subprocess per invocation is both the most
// realistic test (exactly how a user/CI actually runs this) and immune to
// that singleton-state problem. Requires `dist/cli.js` to be built first —
// already true of this package's real test sequence (build before test,
// see scripts/packages.test.ts).

describe(' regression: subcommand options never collide with the reserved --version flag', () => {
  const cliPath = join(import.meta.dirname, '..', 'dist', 'cli.js');

  function runCli(args: string[]): { stdout: string; stderr: string; status: number } {
    try {
      const stdout = execFileSync('node', [cliPath, ...args], { encoding: 'utf8' });
      return { stdout, stderr: '', status: 0 };
    } catch (err) {
      const e = err as { stdout?: string; stderr?: string; status?: number };
      return { stdout: e.stdout ?? '', stderr: e.stderr ?? '', status: e.status ?? 1 };
    }
  }

  it('gate --candidate-version is parsed and forwarded to gateCommand (not swallowed by --version)', () => {
    // gateCommand fails fast (no real docker/build work) when the app dir
    // doesn't exist — exercises the full real parse path safely.
    const result = runCli([
      'gate',
      '--local',
      '--app',
      '/definitely/nonexistent/app/dir',
      '--package',
      'some-pkg',
      '--candidate-version',
      '1.2.3',
    ]);

    // The bug's signature: commander's own --version handler would print
    // "0.0.0" and exit 0. The real path exits 1 (app dir not found) and
    // never prints the CLI's own version string.
    expect(result.status).toBe(1);
    expect(result.stdout + result.stderr).not.toContain('0.0.0');
    expect(result.stderr).toContain('app directory not found');
  });

  it('tests check-lockstep --component-version is parsed and forwarded (not swallowed by --version)', () => {
    const result = runCli([
      'tests',
      'check-lockstep',
      '--package-name',
      '@RippleViewTests/core-controls',
      '--component-version',
      '17.2.0',
      // An unreachable registry — fails fast, safely, with no real network dependency succeeding.
      '--registry',
      'http://127.0.0.1:1',
    ]);

    expect(result.status).toBe(1);
    expect(result.stdout + result.stderr).not.toContain('0.0.0');
    expect(result.stderr).toContain('failed to fetch published versions');
  });

  it("sanity: the bug WOULD have looked like this — commander's reserved --version prints the CLI version and exits 0 for the bare root flag", () => {
    const result = runCli(['--version']);
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe(VERSION);
  });
});
