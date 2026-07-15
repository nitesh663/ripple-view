import { Component } from '@angular/core';
import { SelectionChangedEvent } from '@ag-grid-community/core';
import { ColumnMeta } from '@op/dynamic';

interface TargetRow {
  id: number;
  name: string;
  region: string;
  category: string;
  budget: number;
  actual: number;
  variance: number;
  status: string;
  startDate: string;
  owner: string;
}

@Component({
  selector: 'app-target',
  templateUrl: './target.component.html',
  styleUrls: ['./target.component.scss'],
})
export class TargetComponent {
  selectedRow: TargetRow | null = null;

  readonly regionOptions = [
    { label: 'North', value: 'North' },
    { label: 'South', value: 'South' },
    { label: 'East', value: 'East' },
    { label: 'West', value: 'West' },
    { label: 'Central', value: 'Central' },
  ];

  readonly categoryOptions = [
    { label: 'Digital', value: 'Digital' },
    { label: 'Print', value: 'Print' },
    { label: 'OOH', value: 'OOH' },
    { label: 'Radio', value: 'Radio' },
  ];

  readonly statusOptions = [
    { label: 'On Track', value: 'On Track' },
    { label: 'At Risk', value: 'At Risk' },
    { label: 'Behind', value: 'Behind' },
    { label: 'Completed', value: 'Completed' },
  ];

  colsMeta: ColumnMeta[] = [
    { field: 'id', headerName: 'ID', type: 'number', width: 70 },
    { field: 'name', headerName: 'Name', type: 'text', flex: 1.5 },
    {
      field: 'region',
      headerName: 'Region',
      type: 'dropdown',
      flex: 1,
      options: this.regionOptions,
    },
    {
      field: 'category',
      headerName: 'Category',
      type: 'dropdown',
      flex: 1,
      options: this.categoryOptions,
    },
    { field: 'budget', headerName: 'Budget ($K)', type: 'number', width: 110 },
    { field: 'actual', headerName: 'Actual ($K)', type: 'number', width: 110 },
    { field: 'variance', headerName: 'Variance', type: 'number', width: 100 },
    {
      field: 'status',
      headerName: 'Status',
      type: 'dropdown',
      width: 120,
      options: this.statusOptions,
      colorMap: {
        'On Track': '#2e7d32',
        'At Risk': '#f57c00',
        'Behind': '#b00020',
        'Completed': '#1565c0',
      },
    },
    { field: 'startDate', headerName: 'Start Date', type: 'date', width: 120 },
    { field: 'owner', headerName: 'Owner', type: 'text', flex: 1 },
  ];

  rowsMeta: TargetRow[] = this.buildRows();

  onSelectionChanged(event: SelectionChangedEvent): void {
    const selected = event.api.getSelectedRows();
    this.selectedRow = selected.length ? (selected[0] as TargetRow) : null;
  }

  private buildRows(): TargetRow[] {
    const regions = ['North', 'South', 'East', 'West', 'Central'];
    const categories = ['Digital', 'Print', 'OOH', 'Radio'];
    const statuses = ['On Track', 'At Risk', 'Behind', 'Completed'];
    const owners = ['Alice', 'Bob', 'Carol', 'Dave', 'Eve'];
    return Array.from({ length: 20 }, (_, i) => {
      const budget = (i + 1) * 50;
      const actual = Math.round(budget * (0.7 + (i % 5) * 0.1));
      return {
        id: i + 1,
        name: `Target ${i + 1}`,
        region: regions[i % regions.length],
        category: categories[i % categories.length],
        budget,
        actual,
        variance: actual - budget,
        status: statuses[i % statuses.length],
        startDate: `2026-0${(i % 9) + 1}-01`,
        owner: owners[i % owners.length],
      };
    });
  }
}
