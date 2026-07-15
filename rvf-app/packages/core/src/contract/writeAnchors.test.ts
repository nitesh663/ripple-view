import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { writeAnchorsIntoContractFile } from './writeAnchors.js';
import { loadContract } from './loader.js';

// Real temp dirs, no mocks (G13) — mirrors the bundle.test.ts convention.

let root: string;
let contractFile: string;

const REAL_CONTRACT_YAML = `# Header comment that must survive a format-preserving write (AC-2).
component:
  name: rv-multi-select
  package: "@enterprise/core-controls"
  primaryRole: combobox
  description: Multi-select wrapping PrimeNG's <p-multiSelect>.

anchors:
  - id: trigger
    role: combobox
    name: "*"
    required: true
    description: the closed trigger.

states:
  - id: open
    description: panel open

api:
  inputs: []
  outputs: []
  slots: []

data:
  shape: {}
  example: {}

probes: [combobox]

a11y:
  requiredRoles: [combobox]
  requiredLabels: []
  wcagLevel: AA
`;

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), 'rv-core-write-anchors-'));
  contractFile = join(root, 'contract.yaml');
  writeFileSync(contractFile, REAL_CONTRACT_YAML);
});

afterAll(() => {
  rmSync(root, { recursive: true, force: true });
});

describe('writeAnchorsIntoContractFile — AC-2/T-8.4.3: format-preserving merge into a real file', () => {
  it('adds a new anchor and preserves the header comment + every untouched field', () => {
    const result = writeAnchorsIntoContractFile(contractFile, [{ role: 'option', name: 'Alpha' }], {
      name: 'rv-multi-select',
      package: '@enterprise/core-controls',
    });

    expect(result.scaffolded).toBe(false);
    expect(result.added).toEqual([
      expect.objectContaining({ role: 'option', name: 'Alpha', required: false }),
    ]);

    const written = readFileSync(contractFile, 'utf8');
    expect(written).toContain(
      '# Header comment that must survive a format-preserving write (AC-2).',
    );
    expect(written).toContain('id: trigger');

    const reloaded = loadContract(contractFile);
    expect(reloaded.anchors.map((a) => a.id)).toEqual(
      expect.arrayContaining(['trigger', result.added[0]?.id]),
    );
    expect(reloaded.states).toEqual([{ id: 'open', description: 'panel open' }]);
  });

  it('is a no-op (file untouched) when every captured node is already covered', () => {
    const before = readFileSync(contractFile, 'utf8');
    const result = writeAnchorsIntoContractFile(
      contractFile,
      [{ role: 'combobox', name: 'anything — matches the wildcard trigger anchor' }],
      { name: 'rv-multi-select', package: '@enterprise/core-controls' },
    );
    expect(result.added).toEqual([]);
    expect(readFileSync(contractFile, 'utf8')).toBe(before);
  });

  it('T-8.4.3: scaffolds a brand-new contract.yaml when none exists yet', () => {
    const newFile = join(root, 'new-component', 'contract.yaml');
    mkdirSync(join(root, 'new-component'), { recursive: true });
    expect(existsSync(newFile)).toBe(false);

    const result = writeAnchorsIntoContractFile(newFile, [{ role: 'button', name: 'Submit' }], {
      name: 'rv-new-component',
      package: '@enterprise/core-controls',
    });

    expect(result.scaffolded).toBe(true);
    expect(existsSync(newFile)).toBe(true);

    const reloaded = loadContract(newFile);
    expect(reloaded.component.name).toBe('rv-new-component');
    expect(reloaded.anchors).toEqual([expect.objectContaining({ role: 'button', name: 'Submit' })]);
  });
});
