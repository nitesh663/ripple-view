import { Component } from '@angular/core';
import { IToolPanelAngularComp } from '@ag-grid-community/angular';
import { Column, IToolPanelParams } from '@ag-grid-community/core';

/**
 * Lightweight columns tool panel: lists grid columns with a checkbox to toggle
 * visibility. Reorder/width are handled by AG Grid's own drag behaviour; this
 * panel focuses on show/hide.
 */
@Component({
  selector: 'occ-columns-panel',
  templateUrl: './occ-columns-panel.component.html',
  styleUrls: ['./occ-columns-panel.component.scss'],
})
export class OccColumnsPanelComponent implements IToolPanelAngularComp {
  /** Columns shown in the panel. */
  columns: Column[] = [];

  private params!: IToolPanelParams;

  agInit(params: IToolPanelParams): void {
    this.params = params;
    this.refresh();
  }

  refresh(): void {
    this.columns = this.params?.columnApi?.getColumns() ?? [];
  }

  isVisible(column: Column): boolean {
    return column.isVisible();
  }

  toggle(column: Column, event: Event): void {
    const visible = (event.target as HTMLInputElement).checked;
    this.params.columnApi.setColumnVisible(column.getColId(), visible);
  }

  headerName(column: Column): string {
    return column.getColDef().headerName ?? column.getColId();
  }

  trackByColId(_index: number, column: Column): string {
    return column.getColId();
  }
}
