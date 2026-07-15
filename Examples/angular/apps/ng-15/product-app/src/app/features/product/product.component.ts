import { Component, OnInit } from '@angular/core';
import { GenericAggridConfgProvider, KVPair, OpColDef, OpSideBarDef } from '@op/aggrid';

interface ProductRow {
  id: number;
  name: string;
  category: string;
  sku: string;
  price: number;
  stock: number;
  status: string;
  region: string;
  lastUpdated: string;
  rating: number;
}

@Component({
  selector: 'app-product',
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.scss'],
})
export class ProductComponent implements OnInit {
  statusOptions = [
    { label: 'All', value: '' },
    { label: 'Active', value: 'Active' },
    { label: 'Inactive', value: 'Inactive' },
    { label: 'Discontinued', value: 'Discontinued' },
  ];

  selectedStatus = '';

  columnDefs: OpColDef<ProductRow>[] = [];
  rowData: ProductRow[] = [];
  sidebarDef?: OpSideBarDef;

  filterMeta: KVPair[] = [
    { key: 'name', value: 'Name', type: 'input', placeholder: 'Search name' },
    { key: 'category', value: 'Category', type: 'input' },
    {
      key: 'status',
      value: 'Status',
      type: 'dropdown',
      options: [
        { label: 'Active', value: 'Active' },
        { label: 'Inactive', value: 'Inactive' },
        { label: 'Discontinued', value: 'Discontinued' },
      ],
    },
    { key: 'region', value: 'Region', type: 'input' },
  ];

  constructor(private readonly sidebarProvider: GenericAggridConfgProvider) {}

  ngOnInit(): void {
    this.columnDefs = this.buildColumns();
    this.rowData = this.buildRows();
    this.sidebarDef = this.sidebarProvider.buildSideBar({
      filterMeta: this.filterMeta,
      filterBarPanelId: 'product-grid',
      filterPanelName: 'Product Filters',
    });
  }

  get filteredRows(): ProductRow[] {
    if (!this.selectedStatus) return this.rowData;
    return this.rowData.filter(r => r.status === this.selectedStatus);
  }

  private buildColumns(): OpColDef<ProductRow>[] {
    return [
      { field: 'id', headerName: 'ID', width: 70, sortable: true },
      { field: 'name', headerName: 'Name', flex: 1.5, sortable: true, filter: true },
      { field: 'category', headerName: 'Category', flex: 1, sortable: true, filter: true },
      { field: 'sku', headerName: 'SKU', width: 120, sortable: true },
      {
        field: 'price',
        headerName: 'Price ($)',
        width: 110,
        sortable: true,
        valueFormatter: p => (p.value != null ? `$${(p.value as number).toFixed(2)}` : ''),
      },
      { field: 'stock', headerName: 'Stock', width: 90, sortable: true },
      { field: 'status', headerName: 'Status', width: 120, sortable: true, filter: true },
      { field: 'region', headerName: 'Region', flex: 1, sortable: true, filter: true },
      { field: 'lastUpdated', headerName: 'Last Updated', flex: 1 },
      { field: 'rating', headerName: 'Rating', width: 90, sortable: true },
    ];
  }

  private buildRows(): ProductRow[] {
    const categories = ['Electronics', 'Apparel', 'Home', 'Sports', 'Food'];
    const regions = ['North', 'South', 'East', 'West', 'Central'];
    const statuses = ['Active', 'Active', 'Active', 'Inactive', 'Discontinued'];
    return Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: `Product ${i + 1}`,
      category: categories[i % categories.length],
      sku: `SKU-${String(1000 + i).padStart(4, '0')}`,
      price: parseFloat(((i + 1) * 24.99).toFixed(2)),
      stock: (i + 1) * 37,
      status: statuses[i % statuses.length],
      region: regions[i % regions.length],
      lastUpdated: `2026-06-${String((i % 28) + 1).padStart(2, '0')}`,
      rating: parseFloat((3 + (i % 5) * 0.4).toFixed(1)),
    }));
  }
}
