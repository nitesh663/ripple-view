import { Component, EventEmitter, Input, Output } from '@angular/core';

import { SaveFilterPayload } from '../../models/save-filter.model';

/**
 * Small form that captures a name (and default flag) for the current filter
 * values and emits a `SaveFilterPayload` the parent persists via `SavedFilterService`.
 */
@Component({
  selector: 'occ-save-configuration-sidebar',
  templateUrl: './save-configuration-sidebar.component.html',
  styleUrls: ['./save-configuration-sidebar.component.scss'],
})
export class SaveConfigurationSidebarComponent {
  /** Panel the saved filter belongs to. */
  @Input() filterBarPanelId = '';
  /** The current applied values to persist. */
  @Input() values: Record<string, unknown> = {};

  /** Emitted with the payload to save. */
  @Output() save = new EventEmitter<SaveFilterPayload>();
  /** Emitted when the user cancels. */
  @Output() cancel = new EventEmitter<void>();

  name = '';
  isDefault = false;

  /** Whether the form can be submitted. */
  get canSave(): boolean {
    return this.name.trim().length > 0;
  }

  onSubmit(): void {
    if (!this.canSave) {
      return;
    }
    this.save.emit({
      name: this.name.trim(),
      filterBarPanelId: this.filterBarPanelId,
      values: this.values,
      isDefault: this.isDefault,
    });
    this.name = '';
    this.isDefault = false;
  }
}
