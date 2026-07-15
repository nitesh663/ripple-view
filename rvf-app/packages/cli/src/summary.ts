import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

// ── SummaryRecord ─────────────────────────────────────────────────────────────

export interface SummaryRecord {
  tenant: string;
  verdict: 'pass' | 'fail';
  timestamp: string;
  durationMs: number;
  findings: unknown[];
}

// ── writeSummary ──────────────────────────────────────────────────────────────

function defaultWrite(path: string, content: string): void {
  writeFileSync(path, content, 'utf8');
}

/**
 * Serialise `record` to JSON and write it to `outputDir/summary.json`.
 * The caller is responsible for ensuring `outputDir` exists.
 * `writeFn` is injectable for testing — defaults to `fs.writeFileSync`.
 *
 * Generic over the record shape so other commands (e.g. `gate`'s own
 * additive `GateSummaryRecord`, ) can reuse this writer without
 * widening or mutating `SummaryRecord` itself (G5: that shape stays frozen).
 */
export function writeSummary<T>(
  record: T,
  outputDir: string,
  writeFn: (path: string, content: string) => void = defaultWrite,
): void {
  const dest = join(outputDir, 'summary.json');
  writeFn(dest, JSON.stringify(record, null, 2));
}
