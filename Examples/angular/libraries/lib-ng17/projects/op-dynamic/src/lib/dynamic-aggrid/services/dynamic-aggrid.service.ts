import { Injectable } from '@angular/core';
import { ColDef, GridOptions, RowModelType } from '@ag-grid-community/core';
import {
  ActionRendererComponent,
  CheckboxRendererComponent,
  NumericEditorComponent,
  OccDropdownEditorComponent,
  OccDropdownRendererComponent,
  OpColDef,
  TextColorRendererComponent,
  TextEditorComponent,
} from '@op/aggrid';

import { ColumnMeta, DynamicColumnType } from '../models/dynamic-aggrid.model';

/** Framework-component names referenced by generated column defs. */
export const DYNAMIC_FRAMEWORK_COMPONENTS = {
  textColorRenderer: 'occDynTextColorRenderer',
  checkboxRenderer: 'occDynCheckboxRenderer',
  actionRenderer: 'occDynActionRenderer',
  dropdownRenderer: 'occDynDropdownRenderer',
  textEditor: 'occDynTextEditor',
  numericEditor: 'occDynNumericEditor',
  dropdownEditor: 'occDynDropdownEditor',
} as const;

/** Options that influence the generated `GridOptions`. */
export interface DynamicGridOptionsConfig {
  rowModelType?: 'clientSide' | 'infinite' | 'serverSide';
  rowSelection?: 'single' | 'multiple';
  paginationPageSize?: number;
  cacheBlockSize?: number;
  enableServerSideSorting?: boolean;
  enableServerSideFilter?: boolean;
  defaultColDef?: ColDef;
  pagination?: boolean;
}

/**
 * Turns column metadata (`ColumnMeta[]`) into the artefacts `occ-aggrid` needs:
 * an `OpColDef[]`, the framework-components map (op-aggrid renderers/editors) and
 * a `GridOptions`. This is the whole job of the dynamic layer — config from
 * metadata; the grid wrapping itself lives in `@op/aggrid`.
 */
@Injectable({ providedIn: 'root' })
export class DynamicAggridService {
  /** The renderer/editor map passed to `occ-aggrid`'s `frameworkComponents`. */
  buildFrameworkComponents(): Record<string, unknown> {
    const names = DYNAMIC_FRAMEWORK_COMPONENTS;
    return {
      [names.textColorRenderer]: TextColorRendererComponent,
      [names.checkboxRenderer]: CheckboxRendererComponent,
      [names.actionRenderer]: ActionRendererComponent,
      [names.dropdownRenderer]: OccDropdownRendererComponent,
      [names.textEditor]: TextEditorComponent,
      [names.numericEditor]: NumericEditorComponent,
      [names.dropdownEditor]: OccDropdownEditorComponent,
    };
  }

  /** Map column metadata into `OpColDef[]`. */
  buildColumnDefs(colsMeta: ColumnMeta[]): OpColDef[] {
    return (colsMeta ?? []).map((meta) => this.buildColumnDef(meta));
  }

  /** Assemble `GridOptions` from the metadata-driven inputs. */
  buildGridOptions(config: DynamicGridOptionsConfig): GridOptions {
    const rowModelType = (config.rowModelType ?? 'clientSide') as RowModelType;
    const options: GridOptions = {
      rowModelType,
      rowSelection: config.rowSelection,
      defaultColDef: {
        sortable: true,
        resizable: true,
        filter: true,
        ...(config.defaultColDef ?? {}),
      },
    };

    if (config.pagination) {
      options.pagination = true;
      if (config.paginationPageSize) {
        options.paginationPageSize = config.paginationPageSize;
      }
    }

    if (rowModelType === 'infinite' || rowModelType === 'serverSide') {
      if (config.cacheBlockSize) {
        options.cacheBlockSize = config.cacheBlockSize;
      }
    }

    if (rowModelType === 'serverSide') {
      options.serverSideSortAllLevels = config.enableServerSideSorting ?? false;
      options.serverSideFilterAllLevels = config.enableServerSideFilter ?? false;
    }

    return options;
  }

  /** Map a single metadata entry into an `OpColDef`. */
  private buildColumnDef(meta: ColumnMeta): OpColDef {
    const type: DynamicColumnType = meta.type ?? 'text';
    const colDef: OpColDef = {
      field: meta.field,
      headerName: meta.headerName ?? meta.field,
      opType: type,
      editable: meta.editable ?? false,
      width: meta.width,
      flex: meta.flex,
      sortable: meta.sortable,
      filter: meta.filter,
      hide: meta.hide,
      checkboxSelection: meta.checkboxSelection,
      headerCheckboxSelection: meta.headerCheckboxSelection,
    };

    this.applyRenderer(colDef, meta, type);
    this.applyEditor(colDef, meta, type);

    // Native escape hatch wins last.
    return { ...colDef, ...(meta.colDef ?? {}) };
  }

  private applyRenderer(colDef: OpColDef, meta: ColumnMeta, type: DynamicColumnType): void {
    const names = DYNAMIC_FRAMEWORK_COMPONENTS;
    if (meta.renderer) {
      colDef.cellRenderer = meta.renderer;
      colDef.cellRendererParams = meta.rendererParams;
      return;
    }
    switch (type) {
      case 'checkbox':
        colDef.cellRenderer = names.checkboxRenderer;
        colDef.cellRendererParams = { editable: meta.editable, ...(meta.rendererParams ?? {}) };
        break;
      case 'dropdown':
        colDef.cellRenderer = names.dropdownRenderer;
        colDef.cellRendererParams = { options: meta.options ?? [], ...(meta.rendererParams ?? {}) };
        break;
      case 'action':
        colDef.cellRenderer = names.actionRenderer;
        colDef.cellRendererParams = { actions: meta.actions ?? [], ...(meta.rendererParams ?? {}) };
        colDef.sortable = meta.sortable ?? false;
        colDef.filter = meta.filter ?? false;
        break;
      case 'date':
      case 'text':
      case 'number':
      default:
        if (meta.colorMap) {
          colDef.cellRenderer = names.textColorRenderer;
          colDef.cellRendererParams = { colorMap: meta.colorMap, ...(meta.rendererParams ?? {}) };
        } else if (meta.rendererParams) {
          colDef.cellRendererParams = meta.rendererParams;
        }
        break;
    }
  }

  private applyEditor(colDef: OpColDef, meta: ColumnMeta, type: DynamicColumnType): void {
    const names = DYNAMIC_FRAMEWORK_COMPONENTS;
    if (!meta.editable && !meta.editor) {
      return;
    }
    if (meta.editor) {
      colDef.cellEditor = meta.editor;
      colDef.cellEditorParams = meta.editorParams;
      return;
    }
    switch (type) {
      case 'number':
        colDef.cellEditor = names.numericEditor;
        colDef.cellEditorParams = meta.editorParams;
        break;
      case 'dropdown':
        colDef.cellEditor = names.dropdownEditor;
        colDef.cellEditorPopup = true;
        colDef.cellEditorParams = { options: meta.options ?? [], ...(meta.editorParams ?? {}) };
        break;
      case 'checkbox':
        // Checkbox renderer handles toggling inline; no separate editor needed.
        break;
      case 'date':
      case 'text':
      default:
        colDef.cellEditor = names.textEditor;
        colDef.cellEditorParams = meta.editorParams;
        break;
    }
  }
}
