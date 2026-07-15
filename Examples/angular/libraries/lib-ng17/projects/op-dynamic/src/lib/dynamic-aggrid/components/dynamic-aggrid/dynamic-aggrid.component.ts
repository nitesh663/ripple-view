import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import {
  CellValueChangedEvent,
  ColDef,
  GridReadyEvent,
  IDatasource,
  IServerSideDatasource,
  SelectionChangedEvent,
} from '@ag-grid-community/core';
import { OpColDef, OpSideBarDef, KVPair, GenericAggridConfgProvider } from '@op/aggrid';

import { ColumnMeta, FetchDataRequest } from '../../models/dynamic-aggrid.model';
import { DynamicAggridService } from '../../services/dynamic-aggrid.service';

/**
 * `dynamic-aggrid` — a metadata-driven grid. It maps `colsMeta` into the artefacts
 * `occ-aggrid` consumes (columnDefs / gridOptions / frameworkComponents / sidebarDef)
 * and renders `<occ-aggrid>` internally. This layer is config-from-metadata only;
 * the actual grid wrapping lives in `@op/aggrid`.
 */
@Component({
  selector: 'dynamic-aggrid',
  templateUrl: './dynamic-aggrid.component.html',
  styleUrls: ['./dynamic-aggrid.component.scss'],
})
export class DynamicAggridComponent implements OnInit, OnChanges {
  /** Column metadata (mapped to `occ-aggrid`'s columnDefs). */
  @Input() colsMeta: ColumnMeta[] = [];
  /** Row data for the client-side row model. */
  @Input() rowsMeta: unknown[] = [];
  /** Row model to use. */
  @Input() rowModelType: 'clientSide' | 'infinite' | 'serverSide' = 'clientSide';
  /** Row selection mode. */
  @Input() rowSelection?: 'single' | 'multiple';
  /** Pagination page size (also turns pagination on when set). */
  @Input() paginationPageSize?: number;
  /** Cache block size for infinite/server-side models. */
  @Input() cacheBlockSize?: number;
  /** Enable server-side sorting (serverSide model). */
  @Input() enableServerSideSorting = false;
  /** Enable server-side filtering (serverSide model). */
  @Input() enableServerSideFilter = false;
  /** Default column definition merged into every column. */
  @Input() defaultColDef?: ColDef;
  /** Show a header select-all checkbox on the first column. */
  @Input() headerCheckboxSelection = false;
  /** Stable grid id (column-state persistence in op-aggrid). */
  @Input() id = '';
  /** Filter-panel field metadata; when set, a sidebar filter panel is built. */
  @Input() filterMeta: KVPair[] = [];
  /** Explicit side-bar definition (overrides the one built from `filterMeta`). */
  @Input() sidebarDef?: OpSideBarDef;

  /** Re-emits `occ-aggrid` gridReady. */
  @Output() gridReady = new EventEmitter<GridReadyEvent>();
  /** Re-emits selection changes. */
  @Output() selectionChanged = new EventEmitter<SelectionChangedEvent>();
  /** Re-emits cell value changes. */
  @Output() cellValueChanged = new EventEmitter<CellValueChangedEvent>();
  /** Emits when the infinite/server-side model needs a page of data. */
  @Output() fetchData = new EventEmitter<FetchDataRequest>();
  /** Filter passthrough events. */
  @Output() onApplyFilter = new EventEmitter<unknown>();
  @Output() onClearAll = new EventEmitter<unknown>();
  @Output() onFilterSelectionChange = new EventEmitter<unknown>();

  /** Resolved column defs bound to `occ-aggrid`. */
  columnDefs: OpColDef[] = [];
  /** Resolved framework components map. */
  frameworkComponents: Record<string, unknown> = {};
  /** Resolved grid options. */
  gridOptions: ReturnType<DynamicAggridService['buildGridOptions']> = {};
  /** Effective side-bar definition (explicit or built from filterMeta). */
  effectiveSidebarDef?: OpSideBarDef;
  /** Row data passed to occ-aggrid (only for client-side). */
  rowData: unknown[] | null = null;
  /** Whether pagination is enabled. */
  pagination = false;

  constructor(
    private readonly service: DynamicAggridService,
    private readonly sidebarProvider: GenericAggridConfgProvider,
  ) {}

  ngOnInit(): void {
    this.rebuild();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['colsMeta'] ||
      changes['rowsMeta'] ||
      changes['rowModelType'] ||
      changes['filterMeta'] ||
      changes['sidebarDef'] ||
      changes['headerCheckboxSelection'] ||
      changes['rowSelection'] ||
      changes['paginationPageSize']
    ) {
      this.rebuild();
    }
  }

  /** Map all metadata into the config consumed by `occ-aggrid`. */
  private rebuild(): void {
    this.columnDefs = this.applyHeaderCheckbox(this.service.buildColumnDefs(this.colsMeta));
    this.frameworkComponents = this.service.buildFrameworkComponents();
    this.pagination = !!this.paginationPageSize;
    this.gridOptions = this.service.buildGridOptions({
      rowModelType: this.rowModelType,
      rowSelection: this.rowSelection,
      paginationPageSize: this.paginationPageSize,
      cacheBlockSize: this.cacheBlockSize,
      enableServerSideSorting: this.enableServerSideSorting,
      enableServerSideFilter: this.enableServerSideFilter,
      defaultColDef: this.defaultColDef,
      pagination: this.pagination,
    });
    this.rowData = this.rowModelType === 'clientSide' ? (this.rowsMeta ?? []) : null;
    this.effectiveSidebarDef = this.resolveSidebarDef();
  }

  /** Put the header/cell selection checkbox on the first data column when requested. */
  private applyHeaderCheckbox(defs: OpColDef[]): OpColDef[] {
    if (!this.headerCheckboxSelection || !defs.length) {
      return defs;
    }
    const first = defs.find((d) => d.opType !== 'action') ?? defs[0];
    first.headerCheckboxSelection = true;
    first.checkboxSelection = true;
    return defs;
  }

  /** Build a sidebar def from filterMeta unless one is supplied explicitly. */
  private resolveSidebarDef(): OpSideBarDef | undefined {
    if (this.sidebarDef) {
      return this.sidebarDef;
    }
    if (this.filterMeta?.length) {
      return this.sidebarProvider.buildSideBar({
        filterMeta: this.filterMeta,
        filterBarPanelId: this.id || 'dynamic-aggrid',
        filterPanelName: 'Filters',
      });
    }
    return undefined;
  }

  onGridReady(event: GridReadyEvent): void {
    if (this.rowModelType === 'infinite') {
      event.api.setDatasource(this.buildInfiniteDatasource());
    } else if (this.rowModelType === 'serverSide') {
      event.api.setServerSideDatasource(this.buildServerSideDatasource());
    }
    this.gridReady.emit(event);
  }

  onSelectionChanged(event: SelectionChangedEvent): void {
    this.selectionChanged.emit(event);
  }

  onCellValueChanged(event: CellValueChangedEvent): void {
    this.cellValueChanged.emit(event);
  }

  private buildInfiniteDatasource(): IDatasource {
    return {
      getRows: (params) => {
        this.fetchData.emit({
          startRow: params.startRow,
          endRow: params.endRow,
          sortModel: params.sortModel,
          filterModel: params.filterModel,
          success: (rows, lastRow) => params.successCallback(rows, lastRow),
          fail: () => params.failCallback(),
        });
      },
    };
  }

  private buildServerSideDatasource(): IServerSideDatasource {
    return {
      getRows: (params) => {
        const request = params.request;
        this.fetchData.emit({
          startRow: request.startRow ?? 0,
          endRow: request.endRow ?? 0,
          sortModel: request.sortModel,
          filterModel: request.filterModel,
          success: (rows, lastRow) => params.success({ rowData: rows, rowCount: lastRow }),
          fail: () => params.fail(),
        });
      },
    };
  }
}
