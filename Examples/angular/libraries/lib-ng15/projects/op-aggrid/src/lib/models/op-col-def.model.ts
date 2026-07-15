import { ColDef } from '@ag-grid-community/core';

/**
 * `@op` column definition. Extends AG Grid's `ColDef` with a few convenience
 * fields the renderers/editors and the dynamic layer rely on.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface OpColDef<TData = any> extends ColDef<TData> {
  /** Optional logical column type used by the dynamic layer to pick renderer/editor. */
  opType?: 'text' | 'number' | 'dropdown' | 'checkbox' | 'date' | 'action';
  /** Convenience flag: render this column with the colored-text renderer. */
  colorByValue?: boolean;
  /** Options passed to dropdown renderer/editor for this column. */
  opOptions?: { label: string; value: unknown }[];
}
