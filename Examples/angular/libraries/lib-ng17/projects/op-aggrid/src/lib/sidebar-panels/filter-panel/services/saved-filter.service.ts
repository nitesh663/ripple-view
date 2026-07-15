import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import {
  SavedFilter,
  loadSavedFilters,
  removeSavedFilter,
  selectSavedFiltersByPanel,
  upsertSavedFilter,
} from '../../../store/sidebar-filter';
import { SaveFilterPayload } from '../models/save-filter.model';

/**
 * Persists and reads named filter configurations through the sidebar-filter NgRx
 * slice. The save-configuration sidebar and saved-filters sidebar use this service.
 */
@Injectable({ providedIn: 'root' })
export class SavedFilterService {
  constructor(private readonly store: Store) {}

  /** Saved filters scoped to a panel. */
  getByPanel(panelId: string): Observable<SavedFilter[]> {
    return this.store.select(selectSavedFiltersByPanel(panelId));
  }

  /** Persist a new/updated saved filter; returns the generated record. */
  save(payload: SaveFilterPayload): SavedFilter {
    const filter: SavedFilter = {
      id: `${payload.filterBarPanelId}::${payload.name}`,
      filterBarPanelId: payload.filterBarPanelId,
      name: payload.name,
      values: payload.values,
      isDefault: payload.isDefault,
    };
    this.store.dispatch(upsertSavedFilter({ filter }));
    return filter;
  }

  /** Bulk-load saved filters (e.g. hydrated from a backend). */
  load(filters: SavedFilter[]): void {
    this.store.dispatch(loadSavedFilters({ filters }));
  }

  /** Remove a saved filter by id. */
  remove(id: string): void {
    this.store.dispatch(removeSavedFilter({ id }));
  }
}
