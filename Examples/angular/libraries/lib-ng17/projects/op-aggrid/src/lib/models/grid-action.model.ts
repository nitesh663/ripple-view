import { ICellRendererParams } from '@ag-grid-community/core';

/** A single row-action button shown by the action renderer. */
export interface GridAction {
  /** Unique action id emitted back to the host. */
  id: string;
  /** PrimeIcons class, e.g. 'pi pi-pencil'. */
  icon?: string;
  /** Tooltip / aria label (translate key). */
  label?: string;
  /** Optional CSS class applied to the button. */
  styleClass?: string;
  /** When provided, hides the action for rows where it returns false. */
  visible?: (params: ICellRendererParams) => boolean;
}

/** Payload emitted when a row action is clicked. */
export interface GridActionEvent {
  /** The action that was clicked. */
  action: GridAction;
  /** The row data for the clicked row. */
  data: unknown;
  /** The underlying AG Grid renderer params. */
  params: ICellRendererParams;
}

/** Params accepted by the action renderer via `cellRendererParams`. */
export interface ActionRendererParams {
  /** Actions to render for each row. */
  actions: GridAction[];
}

/** Params accepted by the text-color renderer via `cellRendererParams`. */
export interface TextColorRendererParams {
  /** Maps a cell value to a CSS color; falls back to inherit. */
  colorMap?: Record<string, string>;
  /** Resolver used when a static colorMap is not enough. */
  colorResolver?: (value: unknown) => string | undefined;
}

/** Params accepted by the dropdown renderer/editor via params. */
export interface DropdownCellParams {
  options: { label: string; value: unknown }[];
}
