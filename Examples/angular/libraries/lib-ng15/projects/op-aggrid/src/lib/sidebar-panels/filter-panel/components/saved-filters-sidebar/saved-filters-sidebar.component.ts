import { Component, EventEmitter, Input, Output } from '@angular/core';

import { SavedFilter } from '../../../../store/sidebar-filter';

/**
 * Lists the saved filters for a panel and lets the user apply or delete one.
 * Data is supplied by the parent (which reads `SavedFilterService`).
 */
@Component({
  selector: 'occ-saved-filters-sidebar',
  templateUrl: './saved-filters-sidebar.component.html',
  styleUrls: ['./saved-filters-sidebar.component.scss'],
})
export class SavedFiltersSidebarComponent {
  /** Saved filters to display. */
  @Input() savedFilters: SavedFilter[] = [];

  /** Emitted when a saved filter is chosen. */
  @Output() applyFilter = new EventEmitter<SavedFilter>();
  /** Emitted when a saved filter is deleted. */
  @Output() deleteFilter = new EventEmitter<SavedFilter>();

  trackById(_index: number, filter: SavedFilter): string {
    return filter.id;
  }
}
