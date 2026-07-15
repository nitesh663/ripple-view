import { Injectable } from '@angular/core';
import { ColumnApi, ColumnState } from '@ag-grid-community/core';
import { Store } from '@ngrx/store';
import { Observable, take } from 'rxjs';

import { saveGridColumnState } from '../store/grid-controls/grid-controls.actions';
import { selectColumnStateById } from '../store/grid-controls/grid-controls.selectors';

/**
 * Saves and restores AG Grid `ColumnState[]` per grid id through the grid-controls
 * NgRx slice. `occ-aggrid` calls `restore` on `gridReady` and `persist` on column
 * move/resize/visibility changes.
 */
@Injectable({ providedIn: 'root' })
export class AgGridStateService {
  constructor(private readonly store: Store) {}

  /** Dispatch the current column layout for a grid into the store. */
  persist(id: string, columnApi: ColumnApi): void {
    if (!id || !columnApi) {
      return;
    }
    const agGridControls = columnApi.getColumnState();
    this.store.dispatch(saveGridColumnState({ id, agGridControls }));
  }

  /** Observe the persisted column state for a grid id. */
  selectColumnState(id: string): Observable<ColumnState[]> {
    return this.store.select(selectColumnStateById(id));
  }

  /**
   * Restore the persisted column layout onto a grid (one-shot read). No-op when
   * there is nothing persisted yet.
   */
  restore(id: string, columnApi: ColumnApi): void {
    if (!id || !columnApi) {
      return;
    }
    this.selectColumnState(id)
      .pipe(take(1))
      .subscribe((state) => {
        if (state && state.length) {
          columnApi.applyColumnState({ state, applyOrder: true });
        }
      });
  }
}
