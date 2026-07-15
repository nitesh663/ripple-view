import { describe, it, expect } from 'vitest';
import { checkRequiredAnchors } from './checkRequiredAnchors.js';
import type { Contract } from './schema.js';

const baseContract: Contract = {
  component: {
    name: 'rv-multi-select',
    package: '@enterprise/core-controls',
    primaryRole: 'combobox',
    description: 'A multi-select.',
  },
  anchors: [
    { id: 'trigger', role: 'combobox', name: '*', required: true, description: 'the trigger' },
    { id: 'panel', role: 'listbox', name: '*', required: false, description: 'the panel' },
  ],
  states: [],
  api: { inputs: [], outputs: [], slots: [] },
  data: { shape: {}, example: {} },
  probes: [],
  a11y: { requiredRoles: [], requiredLabels: [], wcagLevel: 'AA' },
};

describe('checkRequiredAnchors — AC-1: passes when every required anchor is found', () => {
  it('reports passed:true with a present finding', () => {
    const result = checkRequiredAnchors(baseContract, [{ role: 'combobox', name: 'Status' }]);
    expect(result.passed).toBe(true);
    expect(result.findings).toEqual([
      { anchorId: 'trigger', role: 'combobox', namePattern: '*', status: 'present' },
    ]);
  });

  it('only ever checks required anchors — optional ones are never reported', () => {
    const result = checkRequiredAnchors(baseContract, [{ role: 'combobox', name: 'Status' }]);
    expect(result.findings.some((f) => f.anchorId === 'panel')).toBe(false);
  });
});

describe('checkRequiredAnchors — AC-2/AC-3: a missing anchor gets a concrete, evidence-backed hypothesis', () => {
  it('hypothesizes an unlinked label when orphanLabels has a real signal — the actual  multiselect finding', () => {
    const result = checkRequiredAnchors(baseContract, [], { orphanLabels: ['Status'] });
    expect(result.passed).toBe(false);
    const finding = result.findings[0];
    expect(finding?.status).toBe('missing');
    expect(finding?.hypothesis).toContain('unlinked <label>');
    expect(finding?.hypothesis).toContain('Status');
    expect(finding?.hypothesis).toContain('republish');
  });

  it('falls back to the data-testid hypothesis when no orphan label exists but a testid does', () => {
    const result = checkRequiredAnchors(baseContract, [], { testIdOnly: ['ms-trigger'] });
    const finding = result.findings[0];
    expect(finding?.hypothesis).toContain('data-testid');
    expect(finding?.hypothesis).toContain('ms-trigger');
    expect(finding?.hypothesis).not.toContain('unlinked <label>');
  });

  it('degrades to an honest "no specific cause determined" message when neither signal exists — never fabricates a cause', () => {
    const result = checkRequiredAnchors(baseContract, []);
    const finding = result.findings[0];
    expect(finding?.hypothesis).toContain("can't");
    expect(finding?.hypothesis).toContain('verify the access point');
    expect(finding?.hypothesis).not.toContain('unlinked <label>');
    // It's fine to NAME "data-testid" as one of the signals that was absent
    // (that's an honest description of the evidence), but it must not claim
    // the testid-tier's specific remediation ("a real ARIA role... republish").
    expect(finding?.hypothesis).not.toContain('implement a real ARIA role');
  });

  it('prefers the orphan-label hypothesis over the testid one when both signals are present (label is the more specific, more common real cause)', () => {
    const result = checkRequiredAnchors(baseContract, [], {
      orphanLabels: ['Status'],
      testIdOnly: ['ms-trigger'],
    });
    expect(result.findings[0]?.hypothesis).toContain('unlinked <label>');
  });
});

describe('checkRequiredAnchors — never throws (G10)', () => {
  it('returns passed:true with zero findings for a contract with no required anchors', () => {
    const onlyOptionalAnchor = baseContract.anchors.find((a) => a.id === 'panel');
    const contract: Contract = {
      ...baseContract,
      anchors: onlyOptionalAnchor ? [onlyOptionalAnchor] : [],
    };
    const result = checkRequiredAnchors(contract, []);
    expect(result).toEqual({ passed: true, findings: [] });
  });
});
