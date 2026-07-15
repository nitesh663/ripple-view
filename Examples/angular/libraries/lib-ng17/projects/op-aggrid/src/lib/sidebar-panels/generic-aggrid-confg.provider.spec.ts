import { TestBed } from '@angular/core/testing';

import { GenericAggridConfgProvider } from './generic-aggrid-confg.provider';
import { OP_PANEL_IDS } from './filter-panel/constants/filter.constants';
import { KVPair } from '../models/kv-pair.model';

describe('GenericAggridConfgProvider', () => {
  let provider: GenericAggridConfgProvider;

  const filterMeta: KVPair[] = [{ key: 'status', value: 'Status', type: 'dropdown' }];

  beforeEach(() => {
    TestBed.configureTestingModule({});
    provider = TestBed.inject(GenericAggridConfgProvider);
  });

  it('should be created', () => {
    expect(provider).toBeTruthy();
  });

  it('builds all three tool panels by default', () => {
    const def = provider.buildSideBar({ filterMeta, filterBarPanelId: 'orders' });
    const ids = (def.toolPanels ?? []).map((p) => (typeof p === 'string' ? p : p.id));
    expect(ids).toEqual([OP_PANEL_IDS.filters, OP_PANEL_IDS.columns, OP_PANEL_IDS.groupBy]);
    expect(def.defaultToolPanel).toBe(OP_PANEL_IDS.filters);
  });

  it('threads filter params into the filter panel', () => {
    const def = provider.buildSideBar({
      filterMeta,
      filterBarPanelId: 'orders',
      enableStickyFilters: true,
    });
    const filterPanel = (def.toolPanels ?? []).find(
      (p) => typeof p !== 'string' && p.id === OP_PANEL_IDS.filters,
    );
    const params = (filterPanel as { toolPanelParams: Record<string, unknown> }).toolPanelParams;
    expect(params['filterMeta']).toEqual(filterMeta);
    expect(params['filterBarPanelId']).toBe('orders');
    expect(params['enableStickyFilters']).toBeTrue();
  });

  it('omits panels when toggled off', () => {
    const def = provider.buildSideBar({ filterMeta, showColumns: false, showGroupBy: false });
    expect((def.toolPanels ?? []).length).toBe(1);
  });
});
