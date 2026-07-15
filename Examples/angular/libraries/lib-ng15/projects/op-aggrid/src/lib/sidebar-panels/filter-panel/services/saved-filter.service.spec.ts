import { TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';

import { SavedFilterService } from './saved-filter.service';
import { upsertSavedFilter } from '../../../store/sidebar-filter';

describe('SavedFilterService', () => {
  let service: SavedFilterService;
  let store: jasmine.SpyObj<Store>;

  beforeEach(() => {
    store = jasmine.createSpyObj('Store', ['dispatch', 'select']);
    store.select.and.returnValue(of([]));
    TestBed.configureTestingModule({
      providers: [SavedFilterService, { provide: Store, useValue: store }],
    });
    service = TestBed.inject(SavedFilterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('dispatches an upsert with a derived id on save', () => {
    const result = service.save({ filterBarPanelId: 'orders', name: 'Mine', values: { a: 1 } });
    expect(result.id).toBe('orders::Mine');
    expect(store.dispatch).toHaveBeenCalledWith(upsertSavedFilter({ filter: result }));
  });

  it('reads saved filters by panel', (done) => {
    service.getByPanel('orders').subscribe((list) => {
      expect(list).toEqual([]);
      done();
    });
  });
});
