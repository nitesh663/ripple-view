import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ScenarioRunResult } from './runSuites.js';

// ── Detailed run reporting (results.json + console table) ──────────────────────
// Additive to the frozen summary.json (G5): per-scenario + per-step timing and
// status, for humans (the console table) and machines (results.json).

export interface ResultsRecord {
  tenant: string;
  verdict: 'pass' | 'fail';
  timestamp: string;
  /** Total wall-clock for the whole run. */
  durationMs: number;
  totals: { scenarios: number; passed: number; failed: number };
  scenarios: ScenarioRunResult[];
}

export function buildResultsRecord(
  tenant: string,
  verdict: 'pass' | 'fail',
  timestamp: string,
  durationMs: number,
  scenarios: ScenarioRunResult[],
): ResultsRecord {
  const passed = scenarios.filter((s) => s.verdict === 'pass').length;
  return {
    tenant,
    verdict,
    timestamp,
    durationMs,
    totals: { scenarios: scenarios.length, passed, failed: scenarios.length - passed },
    scenarios,
  };
}

/** Write `results.json` next to summary.json. Caller ensures the dir exists. */
export function writeResults(
  record: ResultsRecord,
  outputDir: string,
  writeFn: (path: string, content: string) => void = (p, c) => writeFileSync(p, c, 'utf8'),
): void {
  writeFn(join(outputDir, 'results.json'), JSON.stringify(record, null, 2));
}

const MARK: Record<string, string> = { pass: '✓', fail: '✗', skipped: '·' };

/**
 * Human-readable per-scenario + per-step table for the console. Pure string
 * builder (no I/O) so it stays trivially testable.
 */
export function formatRunTable(record: ResultsRecord): string {
  const lines: string[] = [];
  const v = record.verdict.toUpperCase();
  lines.push(
    `RippleView run — verdict: ${v}  ` +
      `(${record.totals.scenarios} scenario(s), ${record.totals.passed} passed, ` +
      `${record.totals.failed} failed, ${record.durationMs}ms)`,
  );

  for (const s of record.scenarios) {
    lines.push('');
    lines.push(
      `${MARK[s.verdict] ?? '?'} ${s.scenario}  [${s.browser}]  ${s.durationMs}ms` +
        `  — ${s.feature}`,
    );
    for (const step of s.steps) {
      const mark = MARK[step.status] ?? '?';
      const action = step.action.padEnd(18);
      const dur = step.status === 'skipped' ? '' : `${step.durationMs}ms`;
      lines.push(`    ${mark} ${action} ${step.stepText}  ${dur}`.trimEnd());
    }
  }
  return lines.join('\n') + '\n';
}
