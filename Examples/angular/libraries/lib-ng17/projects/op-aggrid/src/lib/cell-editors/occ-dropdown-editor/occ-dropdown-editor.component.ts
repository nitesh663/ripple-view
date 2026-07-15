import { Component } from '@angular/core';
import { ICellEditorAngularComp } from '@ag-grid-community/angular';
import { ICellEditorParams } from '@ag-grid-community/core';
import { SelectItem } from 'primeng/api';

import { DropdownCellParams } from '../../models/grid-action.model';

/**
 * Dropdown cell editor reusing `op-cc-dropdown`. Used as a popup editor so the
 * panel can overflow the cell. Reports the chosen value via `getValue()`.
 */
@Component({
  selector: 'occ-dropdown-editor',
  templateUrl: './occ-dropdown-editor.component.html',
  styleUrls: ['./occ-dropdown-editor.component.scss'],
})
export class OccDropdownEditorComponent implements ICellEditorAngularComp {
  options: SelectItem[] = [];
  value: unknown;

  agInit(params: ICellEditorParams & DropdownCellParams): void {
    this.options = (params.options ?? []).map((o) => ({ label: o.label, value: o.value }));
    this.value = params.value;
  }

  /** Editor renders in a popup so the dropdown panel is not clipped by the cell. */
  isPopup(): boolean {
    return true;
  }

  getValue(): unknown {
    return this.value;
  }

  onValueChange(event: unknown): void {
    this.value = (event as { value?: unknown } | null)?.value;
  }
}
