import { Component } from '@angular/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { ICellRendererParams } from '@ag-grid-community/core';

/**
 * Renders a boolean cell as a checkbox. When `editable` is passed through
 * `cellRendererParams`, toggling writes back to the row and notifies the grid.
 */
@Component({
  selector: 'occ-checkbox-renderer',
  templateUrl: './checkbox-renderer.component.html',
  styleUrls: ['./checkbox-renderer.component.scss'],
})
export class CheckboxRendererComponent implements ICellRendererAngularComp {
  /** Current checked state. */
  checked = false;
  /** Whether the user may toggle the checkbox. */
  editable = false;

  private params!: ICellRendererParams & { editable?: boolean };

  agInit(params: ICellRendererParams & { editable?: boolean }): void {
    this.params = params;
    this.checked = Boolean(params.value);
    this.editable = Boolean(params.editable);
  }

  refresh(params: ICellRendererParams & { editable?: boolean }): boolean {
    this.agInit(params);
    return true;
  }

  onToggle(event: Event): void {
    if (!this.editable) {
      return;
    }
    this.checked = (event.target as HTMLInputElement).checked;
    if (this.params.colDef?.field) {
      this.params.node.setDataValue(this.params.colDef.field, this.checked);
    }
  }
}
