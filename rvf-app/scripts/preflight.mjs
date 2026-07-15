/**
 * preflight.mjs — RippleView developer environment pre-flight checker ()
 *
 * Checks that all required tools are installed and meet the minimum version
 * requirements. Exports named functions so tests can inject a mock executor
 * (G13 determinism — no real execSync at module scope).
 *
 * Usage (direct):
 *   node scripts/preflight.mjs
 *
 * Exit codes:
 *   0 — all hard-required tools pass
 *   1 — one or more hard-required tools are missing or fail the version check
 */

/**
 * @typedef {'pass' | 'fail' | 'warn'} CheckStatus
 *
 * @typedef {Object} ToolResult
 * @property {string}      name — display name
 * @property {CheckStatus} status — 'pass' | 'fail' | 'warn'
 * @property {string}      version — resolved version string, or error message
 */

/** @type {ReadonlyArray<{ name: string; cmd: string; hard: boolean; check?: (raw: string) => boolean }>} */
export const TOOLS = [
  {
    name: 'node',
    cmd: 'node --version',
    hard: true,
    check: (raw) => {
      // raw is e.g. "v20.12.0"
      const match = raw.trim().match(/^v?(\d+)/);
      return match !== null && parseInt(match[1], 10) >= 20;
    },
  },
  {
    name: 'npm',
    cmd: 'npm --version',
    hard: true,
  },
  {
    name: 'docker',
    cmd: 'docker --version',
    hard: true,
  },
  {
    name: 'git',
    cmd: 'git --version',
    hard: true,
  },
  {
    name: 'code',
    cmd: 'code --version',
    hard: false, // VSCode is optional in headless/CI environments
  },
];

/**
 * Checks a single tool by running its version command via the provided
 * executor. Catches ENOENT (tool not found) and non-zero exits as failures.
 *
 * @param {string}   name — display name for reporting
 * @param {string}   cmd — full shell command to execute (e.g. "node --version")
 * @param {(cmd: string) => string} executor — sync function that runs the command
 *                               and returns stdout (throws on failure)
 * @param {(raw: string) => boolean} [check] — optional version validation fn;
 *                               if omitted, any successful exit = pass
 * @returns {ToolResult}
 */
export function checkTool(name, cmd, executor, check) {
  try {
    const raw = executor(cmd);
    const version = (raw ?? '').toString().trim() || '(no output)';
    const pass = check ? check(raw) : true;
    return { name, status: pass ? 'pass' : 'fail', version };
  } catch (err) {
    const version =
      err && typeof err === 'object' && 'message' in err
        ? /** @type {Error} */ (err).message
        : 'not found';
    return { name, status: 'fail', version };
  }
}

/**
 * Runs the full preflight check for every tool in TOOLS.
 *
 * @param {(cmd: string) => string} executor — sync executor (real or mock)
 * @returns {number} count of hard failures (0 = all good)
 */
export function runPreflight(executor) {
  const results = TOOLS.map(({ name, cmd, hard, check }) => {
    const result = checkTool(name, cmd, executor, check);
    return { ...result, hard };
  });

  // Print results table
  const colWidth = Math.max(...results.map((r) => r.name.length)) + 2;
  const header = `${'Tool'.padEnd(colWidth)} Status   Version`;
  const divider = '-'.repeat(header.length);

  process.stdout.write(`\nRippleView Developer Environment Preflight\n`);
  process.stdout.write(`${divider}\n`);
  process.stdout.write(`${header}\n`);
  process.stdout.write(`${divider}\n`);

  for (const r of results) {
    const icon = r.status === 'pass' ? '✓' : r.status === 'warn' ? '⚠' : '✗';
    const label = r.status === 'pass' ? 'PASS ' : r.status === 'warn' ? 'WARN ' : 'FAIL ';
    process.stdout.write(`${r.name.padEnd(colWidth)} ${icon} ${label}  ${r.version}\n`);
  }

  process.stdout.write(`${divider}\n`);

  const hardFailures = results.filter((r) => r.hard && r.status === 'fail').length;
  const warnings = results.filter((r) => !r.hard && r.status === 'fail').length;

  if (hardFailures === 0) {
    const warnNote =
      warnings > 0 ? ` (${warnings} optional tool(s) not found — see CONTRIBUTING.md)` : '';
    process.stdout.write(`\nAll required tools are present.${warnNote}\n\n`);
  } else {
    process.stdout.write(
      `\n${hardFailures} required tool(s) missing or failed. See docs/CONTRIBUTING.md for setup instructions.\n\n`,
    );
  }

  return hardFailures;
}

// ---------------------------------------------------------------------------
// Entry point — only runs when this file is executed directly.
// Guard uses import.meta.url vs process.argv[1] for cross-platform ESM safety.
// ---------------------------------------------------------------------------
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const thisFile = fileURLToPath(import.meta.url);
const calledFile = process.argv[1];

if (thisFile === calledFile) {
  /** @param {string} cmd */
  const realExecutor = (cmd) =>
    execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });

  const failures = runPreflight(realExecutor);
  process.exit(failures > 0 ? 1 : 0);
}
