import { Component, OnInit } from '@angular/core';
import { GridActionEvent, OpColDef, OpSideBarDef } from '@op/aggrid';
import { GenericAggridConfgProvider, KVPair } from '@op/aggrid';
import {
  ActionRendererComponent,
  CheckboxRendererComponent,
  NumericEditorComponent,
  OccDropdownEditorComponent,
  OccDropdownRendererComponent,
  TextColorRendererComponent,
  TextEditorComponent,
} from '@op/aggrid';

interface OrderRow {
  id: number;
  customer: string;
  product: string;
  status: string;
  amount: number;
  active: boolean;
}

/**
 * `/grid` viewer — demonstrates `occ-aggrid` with cell renderers, cell editors,
 * the sidebar filter panel and live toggles.
 */
@Component({
  selector: 'app-grid-viewer',
  templateUrl: './grid-viewer.component.html',
  styleUrls: ['./grid-viewer.component.scss'],
})
export class GridViewerComponent implements OnInit {
  // Live toggles
  needQuickFilter = true;
  pagination = false;
  showSidebar = true;

  statusOptions = [
    { label: 'Open', value: 'open' },
    { label: 'Shipped', value: 'shipped' },
    { label: 'Cancelled', value: 'cancelled' },
  ];

  /** Map of framework renderer/editor components referenced by columnDefs. */
  frameworkComponents: Record<string, unknown> = {
    textColorRenderer: TextColorRendererComponent,
    actionRenderer: ActionRendererComponent,
    checkboxRenderer: CheckboxRendererComponent,
    occDropdownRenderer: OccDropdownRendererComponent,
    textEditor: TextEditorComponent,
    numericEditor: NumericEditorComponent,
    occDropdownEditor: OccDropdownEditorComponent,
  };

  columnDefs: OpColDef<OrderRow>[] = [];
  rowData: OrderRow[] = [];
  sidebarDef?: OpSideBarDef;

  /** Filter fields shown in the sidebar filter panel. */
  filterMeta: KVPair[] = [
    { key: 'customer', value: 'Customer', type: 'input', placeholder: 'Search customer' },
    {
      key: 'status',
      value: 'Status',
      type: 'dropdown',
      options: this.statusOptions.map((o) => ({ label: o.label, value: o.value })),
    },
    { key: 'product', value: 'Product', type: 'input' },
  ];

  lastEvent = '';

  constructor(private readonly sidebarProvider: GenericAggridConfgProvider) {}

  ngOnInit(): void {
    this.columnDefs = this.buildColumns();
    this.rowData = this.buildRows();
    this.rebuildSidebar();
  }

  rebuildSidebar(): void {
    this.sidebarDef = this.showSidebar
      ? this.sidebarProvider.buildSideBar({
          filterMeta: this.filterMeta,
          filterBarPanelId: 'orders-grid',
          filterPanelName: 'Order Filters',
          enableStickyFilters: true,
        })
      : undefined;
  }

  onApplyFilter(values: unknown): void {
    this.lastEvent = `Applied filter: ${JSON.stringify(values)}`;
  }

  onClearAll(): void {
    this.lastEvent = 'Cleared all filters';
  }

  onCellValueChanged(): void {
    this.lastEvent = 'Cell value changed';
  }

  onActionClick(event: GridActionEvent): void {
    this.lastEvent = `Action "${event.action.id}" on row ${(event.data as OrderRow).id}`;
  }

  private buildColumns(): OpColDef<OrderRow>[] {
    return [
      { field: 'id', headerName: 'ID', width: 80 },
      { field: 'customer', headerName: 'Customer', editable: true, cellEditor: 'textEditor', flex: 1 },
      {
        field: 'product',
        headerName: 'Product',
        editable: true,
        cellEditor: 'occDropdownEditor',
        cellEditorPopup: true,
        cellEditorParams: {
          options: [
            { label: 'Widget', value: 'Widget' },
            { label: 'Gadget', value: 'Gadget' },
            { label: 'Gizmo', value: 'Gizmo' },
          ],
        },
        flex: 1,
      },
      {
        field: 'status',
        headerName: 'Status',
        cellRenderer: 'textColorRenderer',
        cellRendererParams: {
          colorMap: { open: '#2e7d32', shipped: '#1565c0', cancelled: '#b00020' },
        },
        flex: 1,
      },
      {
        field: 'amount',
        headerName: 'Amount',
        editable: true,
        cellEditor: 'numericEditor',
        cellEditorParams: { min: 0, max: 100000 },
        valueFormatter: (p) => (p.value != null ? `$${p.value}` : ''),
        flex: 1,
      },
      {
        field: 'active',
        headerName: 'Active',
        cellRenderer: 'checkboxRenderer',
        cellRendererParams: { editable: true },
        width: 110,
      },
      {
        headerName: 'Actions',
        cellRenderer: 'actionRenderer',
        cellRendererParams: {
          actions: [
            { id: 'edit', icon: 'pi pi-pencil', label: 'Edit' },
            { id: 'delete', icon: 'pi pi-trash', label: 'Delete' },
          ],
          onAction: (e: GridActionEvent) => this.onActionClick(e),
        },
        width: 120,
        sortable: false,
        filter: false,
      },
    ];
  }

  private buildRows(): OrderRow[] {
    return [
      { id: 1, customer: 'Acme Corp', product: 'Widget', status: 'open', amount: 1200, active: true },
      { id: 2, customer: 'Globex', product: 'Gadget', status: 'shipped', amount: 540, active: true },
      { id: 3, customer: 'Initech', product: 'Gizmo', status: 'cancelled', amount: 0, active: false },
      { id: 4, customer: 'Umbrella', product: 'Widget', status: 'shipped', amount: 3200, active: true },
      { id: 5, customer: 'Stark Industries', product: 'Gadget', status: 'open', amount: 8800, active: false },
    ];
  }
}
