import { Component } from '@angular/core';
import { IToolPanelAngularComp } from '@ag-grid-community/angular';
import { Column, IToolPanelParams } from '@ag-grid-community/core';

/**
 * Lightweight group-by tool panel: lists the grid columns and lets the user add
 * or remove them from the row-group set via the column API.
 */
@Component({
  selector: 'occ-groupby-panel',
  templateUrl: './occ-groupby-panel.component.html',
  styleUrls: ['./occ-groupby-panel.component.scss'],
})
export class OccGroupbyPanelComponent implements IToolPanelAngularComp {
  /** Columns offered for grouping. */
  columns: Column[] = [];

  private params!: IToolPanelParams;

  agInit(params: IToolPanelParams): void {
    this.params = params;
    this.refresh();
  }

  refresh(): void {
    this.columns = this.params?.columnApi?.getColumns() ?? [];
  }

  isGrouped(column: Column): boolean {
    return column.isRowGroupActive();
  }

  toggleGroup(column: Column, event: Event): void {
    const grouped = (event.target as HTMLInputElement).checked;
    if (grouped) {
      this.params.columnApi.addRowGroupColumn(column.getColId());
    } else {
      this.params.columnApi.removeRowGroupColumn(column.getColId());
    }
  }

  headerName(column: Column): string {
    return column.getColDef().headerName ?? column.getColId();
  }

  trackByColId(_index: number, column: Column): string {
    return column.getColId();
  }
}
