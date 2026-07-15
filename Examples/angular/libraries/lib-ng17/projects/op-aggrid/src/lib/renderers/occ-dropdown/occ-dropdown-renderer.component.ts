import { Component } from '@angular/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { ICellRendererParams } from '@ag-grid-community/core';
import { SelectItem } from 'primeng/api';

import { DropdownCellParams } from '../../models/grid-action.model';

/**
 * Renders a cell as an inline `op-cc-dropdown`. Selecting an option writes the
 * value back to the row so the grid stays in sync. Reuses the core dropdown control.
 */
@Component({
  selector: 'occ-dropdown-renderer',
  templateUrl: './occ-dropdown-renderer.component.html',
  styleUrls: ['./occ-dropdown-renderer.component.scss'],
})
export class OccDropdownRendererComponent implements ICellRendererAngularComp {
  /** Options shown in the dropdown. */
  options: SelectItem[] = [];
  /** Current value. */
  value: unknown;

  private params!: ICellRendererParams & DropdownCellParams;

  agInit(params: ICellRendererParams & DropdownCellParams): void {
    this.params = params;
    this.options = (params.options ?? []).map((o) => ({ label: o.label, value: o.value }));
    this.value = params.value;
  }

  refresh(params: ICellRendererParams & DropdownCellParams): boolean {
    this.agInit(params);
    return true;
  }

  onValueChange(event: unknown): void {
    this.value = (event as { value?: unknown } | null)?.value;
    if (this.params.colDef?.field) {
      this.params.node.setDataValue(this.params.colDef.field, this.value);
    }
  }
}
