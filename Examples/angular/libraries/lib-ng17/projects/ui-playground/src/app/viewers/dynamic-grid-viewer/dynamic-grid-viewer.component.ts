import { Component } from '@angular/core';
import { ColumnMeta } from '@op/dynamic';
import { KVPair } from '@op/aggrid';

interface EmployeeRow {
  id: number;
  name: string;
  department: string;
  salary: number;
  active: boolean;
}

/**
 * `/dynamic-grid` viewer — the grid is built purely from `colsMeta` + `rowsMeta`
 * JSON metadata via `dynamic-aggrid`, including the sidebar filter panel.
 */
@Component({
  selector: 'app-dynamic-grid-viewer',
  templateUrl: './dynamic-grid-viewer.component.html',
  styleUrls: ['./dynamic-grid-viewer.component.scss'],
})
export class DynamicGridViewerComponent {
  showSidebar = true;
  enablePagination = false;

  /** Pure metadata — no column code, just config. */
  colsMeta: ColumnMeta[] = [
    { field: 'id', headerName: 'ID', type: 'number', width: 80 },
    { field: 'name', headerName: 'Name', type: 'text', editable: true, flex: 1 },
    {
      field: 'department',
      headerName: 'Department',
      type: 'dropdown',
      editable: true,
      flex: 1,
      options: [
        { label: 'Engineering', value: 'Engineering' },
        { label: 'Sales', value: 'Sales' },
        { label: 'Marketing', value: 'Marketing' },
      ],
      colorMap: { Engineering: '#1565c0', Sales: '#2e7d32', Marketing: '#b00020' },
    },
    {
      field: 'salary',
      headerName: 'Salary',
      type: 'number',
      editable: true,
      editorParams: { min: 0, max: 1000000 },
      flex: 1,
    },
    { field: 'active', headerName: 'Active', type: 'checkbox', editable: true, width: 110 },
    {
      field: 'actions',
      headerName: 'Actions',
      type: 'action',
      actions: [
        { id: 'edit', icon: 'pi pi-pencil', label: 'Edit' },
        { id: 'delete', icon: 'pi pi-trash', label: 'Delete' },
      ],
      width: 120,
    },
  ];

  rowsMeta: EmployeeRow[] = [
    { id: 1, name: 'Ada Lovelace', department: 'Engineering', salary: 145000, active: true },
    { id: 2, name: 'Grace Hopper', department: 'Engineering', salary: 152000, active: true },
    { id: 3, name: 'Alan Turing', department: 'Sales', salary: 98000, active: false },
    { id: 4, name: 'Katherine Johnson', department: 'Marketing', salary: 121000, active: true },
    { id: 5, name: 'Edsger Dijkstra', department: 'Engineering', salary: 138000, active: true },
  ];

  filterMeta: KVPair[] = [
    { key: 'name', value: 'Name', type: 'input', placeholder: 'Search name' },
    {
      key: 'department',
      value: 'Department',
      type: 'dropdown',
      options: [
        { label: 'Engineering', value: 'Engineering' },
        { label: 'Sales', value: 'Sales' },
        { label: 'Marketing', value: 'Marketing' },
      ],
    },
  ];

  lastEvent = '';

  get activeFilterMeta(): KVPair[] {
    return this.showSidebar ? this.filterMeta : [];
  }

  get pageSize(): number | undefined {
    return this.enablePagination ? 3 : undefined;
  }

  onCellValueChanged(): void {
    this.lastEvent = 'Cell value changed';
  }

  onApplyFilter(values: unknown): void {
    this.lastEvent = `Applied filter: ${JSON.stringify(values)}`;
  }
}
