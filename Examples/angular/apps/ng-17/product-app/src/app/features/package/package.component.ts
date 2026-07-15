import { Component, OnInit } from '@angular/core';
import { GenericAggridConfgProvider, KVPair, OpColDef, OpSideBarDef } from '@op/aggrid';

interface PackageRow {
  id: number;
  packageName: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalValue: number;
  status: string;
  warehouse: string;
  shipDate: string;
  carrier: string;
}

@Component({
  selector: 'app-package',
  template: `
    <div class="package-grid">
      <div class="package-grid__grid ag-theme-alpine">
        <occ-aggrid
          id="package-grid"
          [columnDefs]="columnDefs"
          [rowData]="rowData"
          [sidebarDef]="sidebarDef"
          [needQuickFilter]="false">
        </occ-aggrid>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; flex: 1; min-height: 0; }
    .package-grid {
      display: flex;
      flex-direction: column;
      height: 100%;
      padding: 12px 16px;
      box-sizing: border-box;
    }
    .package-grid__grid { flex: 1; min-height: 0; }
  `],
})
export class PackageComponent implements OnInit {
  columnDefs: OpColDef<PackageRow>[] = [];
  rowData: PackageRow[] = [];
  sidebarDef?: OpSideBarDef;

  readonly filterMeta: KVPair[] = [
    {
      key: 'status', value: 'Status', type: 'dropdown',
      options: [
        { label: 'Pending', value: 'Pending' },
        { label: 'Shipped', value: 'Shipped' },
        { label: 'Delivered', value: 'Delivered' },
        { label: 'Returned', value: 'Returned' },
      ],
    },
    { key: 'warehouse', value: 'Warehouse', type: 'input' },
    { key: 'carrier', value: 'Carrier', type: 'input' },
  ];

  constructor(private readonly sidebarProvider: GenericAggridConfgProvider) {}

  ngOnInit(): void {
    this.columnDefs = this.buildColumns();
    this.rowData = this.buildRows();
    this.sidebarDef = this.sidebarProvider.buildSideBar({
      filterMeta: this.filterMeta,
      filterBarPanelId: 'package-grid',
      filterPanelName: 'Package Filters',
    });
  }

  private buildColumns(): OpColDef<PackageRow>[] {
    return [
      { field: 'id', headerName: 'ID', width: 70, sortable: true },
      { field: 'packageName', headerName: 'Package', flex: 1.5, sortable: true, filter: true },
      { field: 'productId', headerName: 'Product ID', width: 120, sortable: true },
      { field: 'quantity', headerName: 'Qty', width: 80, sortable: true },
      {
        field: 'unitPrice', headerName: 'Unit Price ($)', width: 130, sortable: true,
        valueFormatter: (p) => (p.value != null ? `$${(p.value as number).toFixed(2)}` : ''),
      },
      {
        field: 'totalValue', headerName: 'Total ($)', width: 120, sortable: true,
        valueFormatter: (p) => (p.value != null ? `$${(p.value as number).toFixed(2)}` : ''),
      },
      { field: 'status', headerName: 'Status', width: 110, sortable: true, filter: true },
      { field: 'warehouse', headerName: 'Warehouse', flex: 1, sortable: true, filter: true },
      { field: 'shipDate', headerName: 'Ship Date', width: 120, sortable: true },
      { field: 'carrier', headerName: 'Carrier', flex: 1, sortable: true, filter: true },
    ];
  }

  private buildRows(): PackageRow[] {
    const statuses = ['Pending', 'Shipped', 'Delivered', 'Returned'];
    const warehouses = ['WH-North', 'WH-South', 'WH-East', 'WH-West'];
    const carriers = ['FedEx', 'UPS', 'DHL', 'USPS'];
    return Array.from({ length: 20 }, (_, i) => {
      const qty = (i + 1) * 5;
      const unitPrice = parseFloat(((i + 1) * 12.5).toFixed(2));
      return {
        id: i + 1,
        packageName: `PKG-${String(2000 + i).padStart(4, '0')}`,
        productId: `SKU-${String(1000 + (i % 10)).padStart(4, '0')}`,
        quantity: qty,
        unitPrice,
        totalValue: parseFloat((qty * unitPrice).toFixed(2)),
        status: statuses[i % statuses.length],
        warehouse: warehouses[i % warehouses.length],
        shipDate: `2026-06-${String((i % 28) + 1).padStart(2, '0')}`,
        carrier: carriers[i % carriers.length],
      };
    });
  }
}
