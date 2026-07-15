import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ContractError, parseContract, loadContract } from './loader.js';

const validYaml = `
component:
  name: datagrid
  package: "@enterprise/datagrid"
  primaryRole: grid
  description: Sortable, selectable data grid.
anchors:
  - { id: header, role: columnheader, name: "*", required: true, description: column headers }
data:
  shape: { rows: "array" }
  example: { rows: [] }
a11y:
  wcagLevel: AA
`;

describe('parseContract', () => {
  it('AC-1: parses valid contract YAML into a Contract', () => {
    const contract = parseContract(validYaml);
    expect(contract.component.name).toBe('datagrid');
    expect(contract.anchors[0]?.id).toBe('header');
  });

  it('AC-1: throws ContractError CONTRACT_SCHEMA_ERROR for malformed contract YAML', () => {
    const badYaml = `
component:
  name: datagrid
data:
  shape: {}
  example: {}
a11y:
  wcagLevel: AA
`;
    expect(() => parseContract(badYaml)).toThrow(ContractError);
    try {
      parseContract(badYaml);
    } catch (err) {
      expect(err).toBeInstanceOf(ContractError);
      expect((err as ContractError).code).toBe('CONTRACT_SCHEMA_ERROR');
    }
  });
});

describe('loadContract', () => {
  it('AC-1: reads a contract.yaml file from disk and validates it', () => {
    const dir = mkdtempSync(join(tmpdir(), 'rv-contract-'));
    const filePath = join(dir, 'contract.yaml');
    writeFileSync(filePath, validYaml, 'utf8');
    try {
      const contract = loadContract(filePath);
      expect(contract.component.package).toBe('@enterprise/datagrid');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
