import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { UnreachablePlaygroundError } from '@rippleview/plugin-playwright';
import { generateAnchorsCommand } from './generate-anchors.js';

// Real temp dirs, no real browser (injected `capture`, G13) — mirrors the
// bundle.test.ts convention. The real Playwright path is exercised
// separately in @rippleview/plugin-playwright's own real-browser tests.

let root: string;
let accessPointsFile: string;
let contractFile: string;

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), 'rv-cli-generate-anchors-'));
  accessPointsFile = join(root, 'access-points.yaml');
  writeFileSync(
    accessPointsFile,
    'accessPoints:\n  - component: core-controls/rv-multi-select\n    url: http://localhost:4200/multi-select\n',
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

describe('generateAnchorsCommand — AC-1/AC-2: real capture (injected) merged into contract.yaml', () => {
  it('exits 0 and merges newly captured anchors', async () => {
    const result = await generateAnchorsCommand({
      accessPoints: accessPointsFile,
      component: 'core-controls/rv-multi-select',
      contract: contractFile,
      package: '@enterprise/core-controls',
      capture: async () => ({
        named: [
          { role: 'option', name: 'Alpha' },
          { role: 'option', name: 'Beta' },
        ],
        testIdOnly: [],
      }),
    });

    expect(result.exitCode).toBe(0);
    expect(result.added).toEqual(['optionAlpha', 'optionBeta']);

    const written = readFileSync(contractFile, 'utf8');
    expect(written).toContain('Alpha');
  });

  it('AC-3: returns exitCode 1 and a clear message when the playground is unreachable, never fabricating anchors', async () => {
    const before = readFileSync(contractFile, 'utf8');
    const result = await generateAnchorsCommand({
      accessPoints: accessPointsFile,
      component: 'core-controls/rv-multi-select',
      contract: contractFile,
      package: '@enterprise/core-controls',
      capture: async () => {
        throw new UnreachablePlaygroundError(
          'http://localhost:4200/multi-select',
          new Error('ECONNREFUSED'),
        );
      },
    });

    expect(result.exitCode).toBe(1);
    expect(result.added).toBeUndefined();
    // Never touches the file on an unreachable playground.
    expect(readFileSync(contractFile, 'utf8')).toBe(before);
  });

  it('returns exitCode 1 when the component has no configured access point', async () => {
    const result = await generateAnchorsCommand({
      accessPoints: accessPointsFile,
      component: 'core-controls/rv-unknown',
      contract: contractFile,
      package: '@enterprise/core-controls',
      capture: async () => ({ named: [], testIdOnly: [] }),
    });
    expect(result.exitCode).toBe(1);
  });

  it('returns exitCode 1 when the access-points file does not exist', async () => {
    const result = await generateAnchorsCommand({
      accessPoints: join(root, 'does-not-exist.yaml'),
      component: 'core-controls/rv-multi-select',
      contract: contractFile,
      package: '@enterprise/core-controls',
      capture: async () => ({ named: [], testIdOnly: [] }),
    });
    expect(result.exitCode).toBe(1);
  });

  it("passes the configured access point's selectNav through to capture()", async () => {
    writeFileSync(
      accessPointsFile,
      'accessPoints:\n  - component: core-controls/rv-multi-select\n    url: http://localhost:4200/\n    selectNav: "Multi Select"\n',
    );
    let capturedArgs: [string, string | undefined] | undefined;

    await generateAnchorsCommand({
      accessPoints: accessPointsFile,
      component: 'core-controls/rv-multi-select',
      contract: contractFile,
      package: '@enterprise/core-controls',
      capture: async (url, selectNav) => {
        capturedArgs = [url, selectNav];
        return { named: [], testIdOnly: [] };
      },
    });

    expect(capturedArgs).toEqual(['http://localhost:4200/', 'Multi Select']);
  });

  it('T-8.4.3: scaffolds a new contract.yaml when none exists, using the component/package name', async () => {
    const newContractFile = join(root, 'new', 'contract.yaml');
    writeFileSync(
      accessPointsFile,
      'accessPoints:\n' +
        '  - component: core-controls/rv-multi-select\n    url: http://localhost:4200/multi-select\n' +
        '  - component: core-controls/rv-new-thing\n    url: http://localhost:4200/new-thing\n',
    );

    const result = await generateAnchorsCommand({
      accessPoints: accessPointsFile,
      component: 'core-controls/rv-new-thing',
      contract: newContractFile,
      package: '@enterprise/core-controls',
      capture: async () => ({ named: [{ role: 'button', name: 'Go' }], testIdOnly: [] }),
    });

    expect(result.exitCode).toBe(0);
    expect(existsSync(newContractFile)).toBe(true);
    expect(readFileSync(newContractFile, 'utf8')).toContain('rv-new-thing');
  });
});

describe('generateAnchorsCommand — graceful "nothing found" handling: never crashes, always reports clearly, safe to loop past', () => {
  it('exits 1 with a G2-respecting message (not a fabricated anchor) when only data-testid elements are found', async () => {
    const before = readFileSync(contractFile, 'utf8');
    const result = await generateAnchorsCommand({
      accessPoints: accessPointsFile,
      component: 'core-controls/rv-multi-select',
      contract: contractFile,
      package: '@enterprise/core-controls',
      capture: async () => ({ named: [], testIdOnly: ['mystery-widget'] }),
    });

    expect(result.exitCode).toBe(1);
    expect(result.added).toBeUndefined();
    // Never writes a data-testid as a contract anchor (G2) — file untouched.
    expect(readFileSync(contractFile, 'utf8')).toBe(before);
  });

  it('exits 1 with a clear "implement a11y or testid" message when literally nothing is found, never throwing', async () => {
    const result = await generateAnchorsCommand({
      accessPoints: accessPointsFile,
      component: 'core-controls/rv-multi-select',
      contract: contractFile,
      package: '@enterprise/core-controls',
      capture: async () => ({ named: [], testIdOnly: [] }),
    });

    expect(result.exitCode).toBe(1);
    expect(result.added).toBeUndefined();
  });
});
