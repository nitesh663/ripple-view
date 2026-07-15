import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import {
  CellClickedEvent,
  CellValueChangedEvent,
  ColumnApi,
  ColumnMovedEvent,
  ColumnResizedEvent,
  ColumnVisibleEvent,
  FilterChangedEvent,
  GridApi,
  GridOptions,
  GridReadyEvent,
  RowSelectedEvent,
  SelectionChangedEvent,
  SortChangedEvent,
} from '@ag-grid-community/core';

import { OpColDef } from '../../models/op-col-def.model';
import { OpSideBarDef } from '../../models/op-sidebar-def.model';
import { AgGridStateService } from '../../services/ag-grid-state.service';
import { registerOpAgGridModules } from '../../ag-grid-modules';

/**
 * `occ-aggrid` — the `@op` wrapper around `<ag-grid-angular>` (modular AG Grid 30).
 *
 * Restores persisted column state on `gridReady` and persists it again whenever
 * columns are moved, resized or toggled. Renderers/editors are supplied via the
 * `frameworkComponents` map (also merged into `gridOptions.components`).
 */
@Component({
  selector: 'occ-aggrid',
  templateUrl: './occ-aggrid.component.html',
  styleUrls: ['./occ-aggrid.component.scss'],
})
export class OccAggridComponent implements OnInit {
  /** Stable grid identifier used to persist/restore column state. */
  @Input() id = '';
  /** Enable tree-data mode. */
  @Input() treeData = false;
  /** Column definitions (required). */
  @Input() columnDefs: OpColDef[] = [];
  /** Optional side-bar definition (filter/columns/groupby tool panels). */
  @Input() sidebarDef?: OpSideBarDef;
  /** Map of framework renderer/editor components keyed by name. */
  @Input() frameworkComponents: Record<string, unknown> = {};
  /** Caller-supplied grid options merged over the component defaults. */
  @Input() gridOptions: GridOptions = {};
  /** Row data (client-side row model). */
  @Input() rowData: unknown[] | null = null;
  /** Show the quick-filter input above the grid. */
  @Input() needQuickFilter = false;
  /** Enable pagination. */
  @Input() pagination = false;

  /** Resolved options actually bound to `<ag-grid-angular>`. */
  mergedGridOptions: GridOptions = {};
  /** Current quick-filter text. */
  quickFilterText = '';

  // Standard grid outputs
  @Output() gridReady = new EventEmitter<GridReadyEvent>();
  @Output() rowSelected = new EventEmitter<RowSelectedEvent>();
  @Output() selectionChanged = new EventEmitter<SelectionChangedEvent>();
  @Output() sortChanged = new EventEmitter<SortChangedEvent>();
  @Output() columnMoved = new EventEmitter<ColumnMovedEvent>();
  @Output() columnResized = new EventEmitter<ColumnResizedEvent>();
  @Output() cellValueChanged = new EventEmitter<CellValueChangedEvent>();
  @Output() cellClicked = new EventEmitter<CellClickedEvent>();

  // Filter-panel passthrough outputs
  @Output() onFilterSelectionChange = new EventEmitter<unknown>();
  @Output() onApplyFilter = new EventEmitter<unknown>();
  @Output() dataNeeded = new EventEmitter<unknown>();
  @Output() onClearAll = new EventEmitter<unknown>();
  @Output() savedFilterData = new EventEmitter<unknown>();

  private gridApi?: GridApi;
  private columnApi?: ColumnApi;

  constructor(private readonly stateService: AgGridStateService) {
    registerOpAgGridModules();
  }

  ngOnInit(): void {
    this.mergedGridOptions = this.buildGridOptions();
  }

  /** Build the effective GridOptions from inputs + caller overrides. */
  private buildGridOptions(): GridOptions {
    const base: GridOptions = {
      defaultColDef: { sortable: true, resizable: true, filter: true, ...(this.gridOptions.defaultColDef ?? {}) },
      animateRows: true,
      ...this.gridOptions,
    };
    base.treeData = this.treeData || base.treeData;
    base.pagination = this.pagination || base.pagination;
    base.components = { ...(this.gridOptions.components ?? {}), ...this.frameworkComponents };
    if (this.sidebarDef) {
      base.sideBar = this.sidebarDef;
    }
    return base;
  }

  onGridReady(event: GridReadyEvent): void {
    this.gridApi = event.api;
    this.columnApi = event.columnApi;
    if (this.id) {
      this.stateService.restore(this.id, event.columnApi);
    }
    this.gridReady.emit(event);
  }

  onRowSelected(event: RowSelectedEvent): void {
    this.rowSelected.emit(event);
  }

  onSelectionChanged(event: SelectionChangedEvent): void {
    this.selectionChanged.emit(event);
  }

  onSortChanged(event: SortChangedEvent): void {
    this.sortChanged.emit(event);
  }

  onColumnMoved(event: ColumnMovedEvent): void {
    this.persistColumnState();
    this.columnMoved.emit(event);
  }

  onColumnResized(event: ColumnResizedEvent): void {
    if (event.finished) {
      this.persistColumnState();
    }
    this.columnResized.emit(event);
  }

  onColumnVisible(_event: ColumnVisibleEvent): void {
    this.persistColumnState();
  }

  onCellValueChanged(event: CellValueChangedEvent): void {
    this.cellValueChanged.emit(event);
  }

  onCellClicked(event: CellClickedEvent): void {
    this.cellClicked.emit(event);
  }

  onFilterChanged(event: FilterChangedEvent): void {
    this.onFilterSelectionChange.emit(event);
  }

  /** Apply the quick-filter text to the grid. */
  applyQuickFilter(text: string): void {
    this.quickFilterText = text;
    this.gridApi?.setQuickFilter(text);
  }

  private persistColumnState(): void {
    if (this.id && this.columnApi) {
      this.stateService.persist(this.id, this.columnApi);
    }
  }
}
