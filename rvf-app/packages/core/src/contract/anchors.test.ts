import { describe, it, expect } from 'vitest';
import { findMissingRequiredAnchors } from './anchors.js';
import type { Contract } from './schema.js';

// AC-2: "Given a missing required anchor in the component, then the
// a11y/structure check flags it."

function makeContract(): Contract {
  return {
    component: {
      name: 'datagrid',
      package: '@enterprise/datagrid',
      primaryRole: 'grid',
      description: 'Sortable, selectable data grid.',
    },
    anchors: [
      {
        id: 'header',
        role: 'columnheader',
        name: '*',
        required: true,
        description: 'column headers',
      },
      {
        id: 'pagination',
        role: 'navigation',
        name: 'Pagination',
        required: true,
        description: 'pager',
      },
      { id: 'sortButton', role: 'button', name: 'Sort *', required: false, description: 'sort' },
    ],
    states: [],
    api: { inputs: [], outputs: [], slots: [] },
    data: { shape: {}, example: {} },
    probes: [],
    a11y: { requiredRoles: [], requiredLabels: [], wcagLevel: 'AA' },
  };
}

describe('findMissingRequiredAnchors', () => {
  it('AC-2: flags a required anchor absent from the present-anchor set', () => {
    const contract = makeContract();
    const missing = findMissingRequiredAnchors(contract, ['header']);
    expect(missing).toEqual(['pagination']);
  });

  it('AC-2: flags nothing when every required anchor is present', () => {
    const contract = makeContract();
    const missing = findMissingRequiredAnchors(contract, ['header', 'pagination']);
    expect(missing).toEqual([]);
  });

  it('AC-2: never flags an optional (required: false) anchor', () => {
    const contract = makeContract();
    const missing = findMissingRequiredAnchors(contract, ['header', 'pagination']);
    expect(missing).not.toContain('sortButton');
  });

  it('AC-2: accepts a Set as well as an array for presentAnchorIds', () => {
    const contract = makeContract();
    const missing = findMissingRequiredAnchors(contract, new Set(['header', 'pagination']));
    expect(missing).toEqual([]);
  });

  it('AC-2: flags every required anchor when none are present', () => {
    const contract = makeContract();
    const missing = findMissingRequiredAnchors(contract, []);
    expect(missing).toEqual(['header', 'pagination']);
  });
});
