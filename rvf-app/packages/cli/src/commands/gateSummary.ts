// gateSummary.ts — the `rv gate` command's own summary.json record shape
// (). This is a NEW additive type, NOT a variant of `SummaryRecord`
// (packages/cli/src/summary.ts) or `RunResult` (packages/core/src/store/types.ts)
// — both of those are frozen contracts (G5). A gate run's verdict has a third
// state, 'errored' (infra, not product — AC-3), that those shapes don't model.

export interface GateSummaryRecord {
  status: 'passed' | 'failed' | 'errored';
  timestamp: string;
  durationMs: number;
  findings: unknown[];
}
