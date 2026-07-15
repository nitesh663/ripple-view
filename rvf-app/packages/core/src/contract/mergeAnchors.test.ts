import { describe, it, expect } from 'vitest';
import { mergeAnchors } from './mergeAnchors.js';
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
  ],
  states: [{ id: 'open', description: 'panel open' }],
  api: { inputs: [], outputs: [], slots: [] },
  data: { shape: {}, example: {} },
  probes: [],
  a11y: { requiredRoles: [], requiredLabels: [], wcagLevel: 'AA' },
};

describe('mergeAnchors — AC-1/AC-2: proposes new anchors, never destroys hand-authored fields', () => {
  it('proposes a new anchor for a captured role+name not already covered', () => {
    const result = mergeAnchors(baseContract, [{ role: 'option', name: 'Alpha' }]);

    expect(result.added).toEqual([
      {
        id: 'optionAlpha',
        role: 'option',
        name: 'Alpha',
        required: false,
        description: expect.stringContaining('Auto-captured'),
      },
    ]);
    expect(result.contract.anchors).toHaveLength(2);
  });

  it('does NOT propose a duplicate when an existing anchor already covers the captured node (wildcard match)', () => {
    // baseContract's "trigger" anchor is { role: combobox, name: "*" } —
    // matches ANY combobox name.
    const result = mergeAnchors(baseContract, [{ role: 'combobox', name: 'Choose a flavor' }]);
    expect(result.added).toEqual([]);
    expect(result.contract).toBe(baseContract);
  });

  it('matches a glob-style name pattern like "Sort *" against a real captured name', () => {
    const contract: Contract = {
      ...baseContract,
      anchors: [
        {
          id: 'sortButton',
          role: 'button',
          name: 'Sort *',
          required: false,
          description: 'sort button',
        },
      ],
    };
    const result = mergeAnchors(contract, [{ role: 'button', name: 'Sort Name' }]);
    expect(result.added).toEqual([]);
  });

  it('never destroys hand-authored fields (description/states/api/data/a11y) — only anchors changes', () => {
    const result = mergeAnchors(baseContract, [{ role: 'option', name: 'Beta' }]);
    expect(result.contract.component).toBe(baseContract.component);
    expect(result.contract.states).toBe(baseContract.states);
    expect(result.contract.api).toBe(baseContract.api);
    expect(result.contract.data).toBe(baseContract.data);
    expect(result.contract.a11y).toBe(baseContract.a11y);
  });

  it('deduplicates multiple captured nodes proposing the same new anchor', () => {
    const result = mergeAnchors(baseContract, [
      { role: 'option', name: 'Gamma' },
      { role: 'option', name: 'Gamma' },
    ]);
    expect(result.added).toHaveLength(1);
  });

  it('returns the SAME contract reference (no-op) when nothing new is captured', () => {
    const result = mergeAnchors(baseContract, []);
    expect(result.contract).toBe(baseContract);
    expect(result.added).toEqual([]);
  });
});
