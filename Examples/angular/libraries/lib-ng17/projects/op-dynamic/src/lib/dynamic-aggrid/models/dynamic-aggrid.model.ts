import { GridOptions } from '@ag-grid-community/core';
import { OpColDef } from '@op/aggrid';

/** Logical column type that drives renderer/editor resolution. */
export type DynamicColumnType = 'text' | 'number' | 'dropdown' | 'checkbox' | 'date' | 'action';

/** A single dropdown/select option in column metadata. */
export interface DynamicOption {
  label: string;
  value: unknown;
}

/**
 * Column metadata consumed by `dynamic-aggrid`. The service maps each entry into
 * an `OpColDef`, resolving the right op-aggrid renderer/editor for its `type`.
 * Any extra AG Grid `ColDef` properties may be passed through `colDef`.
 */
export interface ColumnMeta {
  /** Field/property name on the row data. */
  field: string;
  /** Column header text (translate key or literal). */
  headerName?: string;
  /** Logical type controlling renderer/editor selection. Defaults to 'text'. */
  type?: DynamicColumnType;
  /** Whether the cell is editable (wires the type's editor). */
  editable?: boolean;
  /** Explicit renderer name override (a key in the framework-components map). */
  renderer?: string;
  /** Explicit editor name override (a key in the framework-components map). */
  editor?: string;
  /** Params forwarded to the resolved editor via `cellEditorParams`. */
  editorParams?: Record<string, unknown>;
  /** Params forwarded to the resolved renderer via `cellRendererParams`. */
  rendererParams?: Record<string, unknown>;
  /** Options for dropdown columns (renderer + editor). */
  options?: DynamicOption[];
  /** Value→colour map for the colored-text renderer. */
  colorMap?: Record<string, string>;
  /** Row action buttons for an 'action' column. */
  actions?: { id: string; icon?: string; label?: string }[];
  /** Pin/width/sort and any other native ColDef bits to merge in. */
  width?: number;
  flex?: number;
  sortable?: boolean;
  filter?: boolean | string;
  hide?: boolean;
  /** Show a row-selection checkbox in this column. */
  checkboxSelection?: boolean;
  /** Show a header select-all checkbox in this column. */
  headerCheckboxSelection?: boolean;
  /** Escape hatch: extra native ColDef properties merged last. */
  colDef?: Partial<OpColDef>;
}

/** Server-side / infinite data request emitted by `dynamic-aggrid` via `fetchData`. */
export interface FetchDataRequest {
  /** Zero-based start row. */
  startRow: number;
  /** Exclusive end row. */
  endRow: number;
  /** Active sort model. */
  sortModel: unknown[];
  /** Active filter model. */
  filterModel: unknown;
  /**
   * Callback the consumer invokes with the page of rows and (optionally) the
   * total row count once known.
   */
  success: (rows: unknown[], lastRow?: number) => void;
  /** Callback the consumer invokes on failure. */
  fail: () => void;
}

/** Result of mapping metadata: everything `occ-aggrid` needs. */
export interface DynamicGridConfig {
  columnDefs: OpColDef[];
  gridOptions: GridOptions;
  frameworkComponents: Record<string, unknown>;
}
