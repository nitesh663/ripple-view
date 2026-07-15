import { importProvidersFrom } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { StoreModule } from '@ngrx/store';
import { OpCoreControlsModule } from '@op/core-controls';
import {
  ActionRendererComponent,
  CheckboxRendererComponent,
  GridActionEvent,
  KVPair,
  NumericEditorComponent,
  OccAggridComponent,
  OccColumnsPanelComponent,
  OccDropdownEditorComponent,
  OccDropdownRendererComponent,
  OccFilterSidebarComponent,
  OccGroupbyPanelComponent,
  OpAgGridModule,
  OpColDef,
  OpSideBarDef,
  TextColorRendererComponent,
  TextEditorComponent,
} from '@op/aggrid';
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

const STATUS_COLORS = { open: '#2e7d32', shipped: '#1565c0', cancelled: '#b00020' };

const ROW_DATA = [
  { id: 1, customer: 'Acme Corp', product: 'Widget', status: 'open', amount: 1200, active: true },
  { id: 2, customer: 'Globex', product: 'Gadget', status: 'shipped', amount: 540, active: true },
  { id: 3, customer: 'Initech', product: 'Gizmo', status: 'cancelled', amount: 0, active: false },
  { id: 4, customer: 'Umbrella', product: 'Widget', status: 'shipped', amount: 3200, active: true },
];

const FRAMEWORK_COMPONENTS: Record<string, unknown> = {
  textColorRenderer: TextColorRendererComponent,
  actionRenderer: ActionRendererComponent,
  checkboxRenderer: CheckboxRendererComponent,
  occDropdownRenderer: OccDropdownRendererComponent,
  textEditor: TextEditorComponent,
  numericEditor: NumericEditorComponent,
  occDropdownEditor: OccDropdownEditorComponent,
};

const COLUMN_DEFS: OpColDef[] = [
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
    cellRendererParams: { colorMap: STATUS_COLORS },
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
      onAction: (e: GridActionEvent) => console.log('action', e.action.id),
    },
    width: 120,
    sortable: false,
    filter: false,
  },
];

const FILTER_META: KVPair[] = [
  { key: 'customer', value: 'Customer', type: 'input', placeholder: 'Search customer' },
  {
    key: 'status',
    value: 'Status',
    type: 'dropdown',
    options: [
      { label: 'Open', value: 'open' },
      { label: 'Shipped', value: 'shipped' },
      { label: 'Cancelled', value: 'cancelled' },
    ],
  },
  { key: 'product', value: 'Product', type: 'input' },
];

/** Side-bar definition wiring the three custom @op tool panels (filter/columns/groupby). */
const SIDEBAR_DEF: OpSideBarDef = {
  toolPanels: [
    {
      id: 'opFilters',
      labelDefault: 'Order Filters',
      labelKey: 'opFilters',
      iconKey: 'filter',
      toolPanel: OccFilterSidebarComponent,
      toolPanelParams: {
        filterMeta: FILTER_META,
        filterBarPanelId: 'story-orders',
        filterPanelName: 'Order Filters',
        enableStickyFilters: true,
      },
    },
    {
      id: 'opColumns',
      labelDefault: 'Columns',
      labelKey: 'opColumns',
      iconKey: 'columns',
      toolPanel: OccColumnsPanelComponent,
    },
    {
      id: 'opGroupBy',
      labelDefault: 'Group By',
      labelKey: 'opGroupBy',
      iconKey: 'menu',
      toolPanel: OccGroupbyPanelComponent,
    },
  ],
  defaultToolPanel: 'opFilters',
};

const meta: Meta<OccAggridComponent> = {
  title: 'Data Grid/occ-aggrid',
  component: OccAggridComponent,
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
      imports: [FormsModule, ReactiveFormsModule, OpCoreControlsModule, OpAgGridModule],
    }),
  ],
  argTypes: {
    needQuickFilter: { control: 'boolean', description: 'Show the quick-filter input' },
    pagination: { control: 'boolean', description: 'Enable pagination' },
  },
  args: {
    needQuickFilter: true,
    pagination: false,
  },
};

export default meta;
type Story = StoryObj<OccAggridComponent>;

/** Renderers + editors, no sidebar. */
export const Default: Story = {
  render: (args) => ({
    props: {
      ...args,
      columnDefs: COLUMN_DEFS,
      rowData: ROW_DATA,
      frameworkComponents: FRAMEWORK_COMPONENTS,
    },
    template: `
      <div class="op-story-canvas" style="height: 420px;">
        <occ-aggrid
          id="story-orders"
          [columnDefs]="columnDefs"
          [rowData]="rowData"
          [frameworkComponents]="frameworkComponents"
          [needQuickFilter]="needQuickFilter"
          [pagination]="pagination"
        ></occ-aggrid>
      </div>
    `,
  }),
};

/** Grid with the sidebar filter panel applied (filter/columns/groupby tool panels). */
export const WithSidebarFilter: Story = {
  render: (args) => ({
    props: {
      ...args,
      columnDefs: COLUMN_DEFS,
      rowData: ROW_DATA,
      frameworkComponents: FRAMEWORK_COMPONENTS,
      sidebarDef: SIDEBAR_DEF,
    },
    template: `
      <div class="op-story-canvas" style="height: 460px;">
        <occ-aggrid
          id="story-orders-filtered"
          [columnDefs]="columnDefs"
          [rowData]="rowData"
          [frameworkComponents]="frameworkComponents"
          [sidebarDef]="sidebarDef"
          [needQuickFilter]="needQuickFilter"
          [pagination]="pagination"
        ></occ-aggrid>
      </div>
    `,
  }),
};
