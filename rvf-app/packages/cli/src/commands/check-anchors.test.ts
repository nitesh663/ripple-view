import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { UnreachablePlaygroundError } from '@rippleview/plugin-playwright';
import { checkAnchorsCommand } from './check-anchors.js';

// Real temp dirs, no real browser (injected `capture`, G13) — mirrors
// generate-anchors.test.ts's convention.

let root: string;
let accessPointsFile: string;
let contractFile: string;

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), 'rv-cli-check-anchors-'));
  accessPointsFile = join(root, 'access-points.yaml');
  writeFileSync(
    accessPointsFile,
    'accessPoints:\n  - component: core-controls/rv-multi-select\n    url: http://localhost:4200/\n    selectNav: "Multi Select"\n',
  );
  contractFile = join(root, 'contract.yaml');
  writeFileSync(
    contractFile,
    'component:\n  name: rv-multi-select\n  package: "@enterprise/core-controls"\n  primaryRole: combobox\n  description: x\nanchors:\n  - id: trigger\n    role: combobox\n    name: "*"\n    required: true\n    description: x\nstates: []\napi:\n  inputs: []\n  outputs: []\n  slots: []\ndata:\n  shape: {}\n  example: {}\nprobes: []\na11y:\n  requiredRoles: []\n  requiredLabels: []\n  wcagLevel: AA\n',
  );
});

afterAll(() => {
  rmSync(root, { recursive: true, force: true });
});

describe('checkAnchorsCommand — AC-1: passes when every required anchor is found', () => {
  it('exits 0 with a present finding', async () => {
    const result = await checkAnchorsCommand({
      accessPoints: accessPointsFile,
      component: 'core-controls/rv-multi-select',
      contract: contractFile,
      capture: async () => ({
        named: [{ role: 'combobox', name: 'Status' }],
        testIdOnly: [],
        orphanLabels: [],
      }),
    });

    expect(result.exitCode).toBe(0);
    expect(result.findings).toEqual([
      { anchorId: 'trigger', role: 'combobox', namePattern: '*', status: 'present' },
    ]);
  });
});

describe('checkAnchorsCommand — AC-2/AC-3: the real  multiselect finding, reproduced via injected capture', () => {
  it('exits 1 with a detailed, actionable hypothesis when the trigger has no accessible name but an orphan label exists', async () => {
    const result = await checkAnchorsCommand({
      accessPoints: accessPointsFile,
      component: 'core-controls/rv-multi-select',
      contract: contractFile,
      capture: async () => ({ named: [], testIdOnly: [], orphanLabels: ['Status'] }),
    });

    expect(result.exitCode).toBe(1);
    expect(result.findings).toHaveLength(1);
    expect(result.findings?.[0]?.status).toBe('missing');
    expect(result.findings?.[0]?.hypothesis).toContain('unlinked <label>');
    expect(result.findings?.[0]?.hypothesis).toContain('Status');
  });
});

describe('checkAnchorsCommand — graceful failure paths, never throws', () => {
  it('exits 1 when the playground is unreachable', async () => {
    const result = await checkAnchorsCommand({
      accessPoints: accessPointsFile,
      component: 'core-controls/rv-multi-select',
      contract: contractFile,
      capture: async () => {
        throw new UnreachablePlaygroundError('http://localhost:4200/', new Error('ECONNREFUSED'));
      },
    });
    expect(result.exitCode).toBe(1);
    expect(result.findings).toBeUndefined();
  });

  it('exits 1 when the component has no configured access point', async () => {
    const result = await checkAnchorsCommand({
      accessPoints: accessPointsFile,
      component: 'core-controls/rv-unknown',
      contract: contractFile,
      capture: async () => ({ named: [], testIdOnly: [], orphanLabels: [] }),
    });
    expect(result.exitCode).toBe(1);
  });

  it('exits 1 when the contract.yaml does not exist', async () => {
    const result = await checkAnchorsCommand({
      accessPoints: accessPointsFile,
      component: 'core-controls/rv-multi-select',
      contract: join(root, 'does-not-exist.yaml'),
      capture: async () => ({ named: [], testIdOnly: [], orphanLabels: [] }),
    });
    expect(result.exitCode).toBe(1);
  });

  it('exits 1 when the access-points file does not exist', async () => {
    const result = await checkAnchorsCommand({
      accessPoints: join(root, 'does-not-exist.yaml'),
      component: 'core-controls/rv-multi-select',
      contract: contractFile,
      capture: async () => ({ named: [], testIdOnly: [], orphanLabels: [] }),
    });
    expect(result.exitCode).toBe(1);
  });
});
