import { importProvidersFrom } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { StoreModule } from '@ngrx/store';
import { OpCoreControlsModule } from '@op/core-controls';
import { KVPair } from '@op/aggrid';
import {
  ColumnMeta,
  DynamicAggridComponent,
  FetchDataRequest,
  OpDynamicAggridModule,
} from '@op/dynamic';
import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig, moduleMetadata } from '@storybook/angular';
import { Observable, of } from 'rxjs';

/** In-memory translations so the grid's `| translate` labels resolve in Storybook. */
class GridTranslateLoader implements TranslateLoader {
  getTranslation(): Observable<Record<string, unknown>> {
    return of({
      grid: {
        quickFilter: 'Quick filter…',
        filter: {
          title: 'Filters',
          apply: 'Apply',
          clearAll: 'Clear all',
          save: 'Save',
          savedFilters: 'Saved filters',
          noSaved: 'No saved filters yet',
          configName: 'Configuration name',
          configNamePlaceholder: 'e.g. My open orders',
          markDefault: 'Set as default',
        },
      },
      common: { close: 'Close', cancel: 'Cancel', delete: 'Delete' },
    });
  }
}

const COLS_META: ColumnMeta[] = [
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
  { field: 'salary', headerName: 'Salary', type: 'number', editable: true, flex: 1 },
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

const ROWS_META = [
  { id: 1, name: 'Ada Lovelace', department: 'Engineering', salary: 145000, active: true },
  { id: 2, name: 'Grace Hopper', department: 'Engineering', salary: 152000, active: true },
  { id: 3, name: 'Alan Turing', department: 'Sales', salary: 98000, active: false },
  { id: 4, name: 'Katherine Johnson', department: 'Marketing', salary: 121000, active: true },
];

const FILTER_META: KVPair[] = [
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

/** A tiny in-memory server that pages the same rows, for the server-side story. */
function serverFetch(req: FetchDataRequest): void {
  const page = ROWS_META.slice(req.startRow, req.endRow);
  req.success(page, ROWS_META.length);
}

const meta: Meta<DynamicAggridComponent> = {
  title: 'Data Grid/dynamic-aggrid',
  component: DynamicAggridComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [
        importProvidersFrom(
          BrowserAnimationsModule,
          StoreModule.forRoot({}),
          TranslateModule.forRoot({
            defaultLanguage: 'en',
            loader: { provide: TranslateLoader, useClass: GridTranslateLoader },
          }),
        ),
      ],
    }),
    moduleMetadata({
      imports: [FormsModule, ReactiveFormsModule, OpCoreControlsModule, OpDynamicAggridModule],
    }),
  ],
  argTypes: {
    rowModelType: { control: 'select', options: ['clientSide', 'infinite', 'serverSide'] },
    rowSelection: { control: 'select', options: ['single', 'multiple'] },
    headerCheckboxSelection: { control: 'boolean' },
  },
  args: {
    rowModelType: 'clientSide',
    rowSelection: 'multiple',
    headerCheckboxSelection: true,
  },
};

export default meta;
type Story = StoryObj<DynamicAggridComponent>;

/** Grid built purely from metadata (client-side). */
export const Default: Story = {
  render: (args) => ({
    props: { ...args, colsMeta: COLS_META, rowsMeta: ROWS_META },
    template: `
      <div class="op-story-canvas" style="height: 440px;">
        <dynamic-aggrid
          id="story-dyn"
          [colsMeta]="colsMeta"
          [rowsMeta]="rowsMeta"
          [rowModelType]="rowModelType"
          [rowSelection]="rowSelection"
          [headerCheckboxSelection]="headerCheckboxSelection"
        ></dynamic-aggrid>
      </div>
    `,
  }),
};

/** Metadata-driven grid with the sidebar filter panel built from filterMeta. */
export const WithSidebarFilter: Story = {
  render: (args) => ({
    props: { ...args, colsMeta: COLS_META, rowsMeta: ROWS_META, filterMeta: FILTER_META },
    template: `
      <div class="op-story-canvas" style="height: 460px;">
        <dynamic-aggrid
          id="story-dyn-filtered"
          [colsMeta]="colsMeta"
          [rowsMeta]="rowsMeta"
          [filterMeta]="filterMeta"
          [rowModelType]="rowModelType"
          [rowSelection]="rowSelection"
          [headerCheckboxSelection]="headerCheckboxSelection"
        ></dynamic-aggrid>
      </div>
    `,
  }),
};

/** Server-side row model driven by metadata; data arrives via the fetchData output. */
export const WithServerSide: Story = {
  args: { rowModelType: 'serverSide' },
  render: (args) => ({
    props: {
      ...args,
      colsMeta: COLS_META,
      rowsMeta: [],
      cacheBlockSize: 2,
      enableServerSideSorting: true,
      fetchData: serverFetch,
    },
    template: `
      <div class="op-story-canvas" style="height: 440px;">
        <dynamic-aggrid
          id="story-dyn-server"
          [colsMeta]="colsMeta"
          [rowsMeta]="rowsMeta"
          [rowModelType]="rowModelType"
          [cacheBlockSize]="cacheBlockSize"
          [enableServerSideSorting]="enableServerSideSorting"
          (fetchData)="fetchData($event)"
        ></dynamic-aggrid>
      </div>
    `,
  }),
};
