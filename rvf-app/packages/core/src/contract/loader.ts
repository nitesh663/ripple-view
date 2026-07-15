import { readFileSync } from 'node:fs';
import { parse as parseYaml } from 'yaml';
import type { ZodError } from 'zod';
import type { Contract } from './schema.js';
import { ContractSchema } from './schema.js';

// ── ContractError ────────────────────────────────────────────────────────────

export type ContractErrorCode = 'CONTRACT_SCHEMA_ERROR';

/** Thrown when a contract.yaml fails schema validation (AC-1). */
export class ContractError extends Error {
  readonly code: ContractErrorCode;

  constructor(code: ContractErrorCode, message: string) {
    super(message);
    this.name = 'ContractError';
    this.code = code;
  }
}

function formatZodError(error: ZodError): string {
  return error.issues.map((issue) => `[${issue.path.join('.')}] ${issue.message}`).join('; ');
}

/**
 * Parse a YAML string and validate it against ContractSchema (RippleView_SPECS).
 * Throws ContractError on schema failure.
 */
export function parseContract(yaml: string): Contract {
  const raw: unknown = parseYaml(yaml);
  const result = ContractSchema.safeParse(raw);
  if (!result.success) {
    throw new ContractError(
      'CONTRACT_SCHEMA_ERROR',
      `Component Test Contract is invalid: ${formatZodError(result.error)}`,
    );
  }
  return result.data;
}

/**
 * Read a contract.yaml file from disk, then parse and validate it.
 */
export function loadContract(filePath: string): Contract {
  const content = readFileSync(filePath, 'utf8');
  return parseContract(content);
}
