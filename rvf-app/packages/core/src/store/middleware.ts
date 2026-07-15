import { randomUUID } from 'node:crypto';
import type { RunResult, RedactFn } from './types.js';
import type { RunContext } from '../config/schema.js';

// Redaction placeholder — real PII redaction wired in design
export const identityRedact: RedactFn = (doc) => doc;

// Generate a stable, unique run ID. Injectable for deterministic tests.
export function generateRunId(idGen: () => string = randomUUID): string {
  return idGen();
}

// Stamp tenant identity onto a partial run document using the RunContext.
// This is the only place that copies tenant/department/appName from context to document.
export function stampTenant(
  partial: Omit<RunResult, 'tenant' | 'department' | 'appName'>,
  ctx: RunContext,
): RunResult {
  return {
    ...partial,
    tenant: ctx.tenant,
    department: ctx.department,
    appName: ctx.appName,
  };
}
