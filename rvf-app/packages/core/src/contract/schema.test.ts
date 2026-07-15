import { describe, it, expect } from 'vitest';
import { ContractSchema } from './schema.js';

// AC-1: "Given a contract.yaml per specs, then anchors/states/api/data
// validate against the schema."

const validContract = {
  component: {
    name: 'datagrid',
    package: '@enterprise/datagrid',
    primaryRole: 'grid',
    description: 'Sortable, selectable data grid with pagination.',
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
      id: 'sortButton',
      role: 'button',
      name: 'Sort *',
      required: false,
      description: 'per-column sort',
    },
  ],
  states: [
    {
      id: 'default',
      description: 'rendered with rows',
      reach: { probe: null, preconditions: ['seed:rows>=2'] },
    },
  ],
  api: {
    inputs: [{ name: 'rows', type: 'T[]', required: true, description: 'data' }],
    outputs: [{ name: 'selectionChange', payload: 'T[]', description: 'emitted on select' }],
    slots: [{ name: 'toolbar', description: 'custom toolbar content' }],
  },
  data: {
    shape: { rows: 'array of { id, name, ... }' },
    example: { rows: [{ id: 1, name: 'Alpha' }] },
  },
  probes: ['grid'],
  a11y: {
    requiredRoles: ['grid', 'columnheader'],
    requiredLabels: ['Pagination'],
    wcagLevel: 'AA',
  },
};

describe('ContractSchema', () => {
  it('AC-1: validates a well-formed contract matching RippleView_SPECS', () => {
    const result = ContractSchema.safeParse(validContract);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.component.name).toBe('datagrid');
      expect(result.data.anchors).toHaveLength(2);
      expect(result.data.a11y.wcagLevel).toBe('AA');
    }
  });

  it('AC-1: defaults optional collections (anchors/states/api/probes) when omitted', () => {
    const minimal = {
      component: validContract.component,
      data: validContract.data,
      a11y: { wcagLevel: 'A' },
    };
    const result = ContractSchema.safeParse(minimal);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.anchors).toEqual([]);
      expect(result.data.states).toEqual([]);
      expect(result.data.api).toEqual({ inputs: [], outputs: [], slots: [] });
      expect(result.data.probes).toEqual([]);
      expect(result.data.a11y.requiredRoles).toEqual([]);
    }
  });

  it('AC-1: rejects a contract missing the required "component" block', () => {
    const malformed = { ...validContract, component: undefined };
    const result = ContractSchema.safeParse(malformed);
    expect(result.success).toBe(false);
  });

  it('AC-1: rejects an anchor with a non-boolean "required" field', () => {
    const malformed = {
      ...validContract,
      anchors: [
        { id: 'header', role: 'columnheader', name: '*', required: 'yes', description: 'x' },
      ],
    };
    const result = ContractSchema.safeParse(malformed);
    expect(result.success).toBe(false);
  });

  it('AC-1: rejects an invalid a11y.wcagLevel enum value', () => {
    const malformed = { ...validContract, a11y: { ...validContract.a11y, wcagLevel: 'AAAA' } };
    const result = ContractSchema.safeParse(malformed);
    expect(result.success).toBe(false);
  });

  it('AC-1: rejects a contract missing the required "data" block', () => {
    const malformed = { ...validContract, data: undefined };
    const result = ContractSchema.safeParse(malformed);
    expect(result.success).toBe(false);
  });
});
