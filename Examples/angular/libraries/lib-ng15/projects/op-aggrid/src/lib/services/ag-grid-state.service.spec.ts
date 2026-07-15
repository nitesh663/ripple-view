import { TestBed } from '@angular/core/testing';
import { ColumnApi, ColumnState } from '@ag-grid-community/core';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';

import { AgGridStateService } from './ag-grid-state.service';
import { saveGridColumnState } from '../store/grid-controls/grid-controls.actions';

describe('AgGridStateService', () => {
  let service: AgGridStateService;
  let store: jasmine.SpyObj<Store>;

  beforeEach(() => {
    store = jasmine.createSpyObj('Store', ['dispatch', 'select']);
    TestBed.configureTestingModule({
      providers: [AgGridStateService, { provide: Store, useValue: store }],
    });
    service = TestBed.inject(AgGridStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('dispatches column state on persist', () => {
    const columnState: ColumnState[] = [{ colId: 'a' }];
    const api = { getColumnState: () => columnState } as unknown as ColumnApi;
    service.persist('grid-1', api);
    expect(store.dispatch).toHaveBeenCalledWith(
      saveGridColumnState({ id: 'grid-1', agGridControls: columnState }),
    );
  });

  it('applies persisted state on restore', () => {
    const columnState: ColumnState[] = [{ colId: 'a' }];
    store.select.and.returnValue(of(columnState));
    const applyColumnState = jasmine.createSpy('applyColumnState');
    const api = { applyColumnState } as unknown as ColumnApi;
    service.restore('grid-1', api);
    expect(applyColumnState).toHaveBeenCalledWith({ state: columnState, applyOrder: true });
  });

  it('does not apply when nothing is persisted', () => {
    store.select.and.returnValue(of([]));
    const applyColumnState = jasmine.createSpy('applyColumnState');
    const api = { applyColumnState } as unknown as ColumnApi;
    service.restore('grid-1', api);
    expect(applyColumnState).not.toHaveBeenCalled();
  });
});
