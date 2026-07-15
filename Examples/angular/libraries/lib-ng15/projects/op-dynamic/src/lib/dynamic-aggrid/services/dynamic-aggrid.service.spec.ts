import { TestBed } from '@angular/core/testing';
import {
  ActionRendererComponent,
  CheckboxRendererComponent,
  NumericEditorComponent,
  OccDropdownEditorComponent,
  TextEditorComponent,
} from '@op/aggrid';

import { DynamicAggridService, DYNAMIC_FRAMEWORK_COMPONENTS } from './dynamic-aggrid.service';
import { ColumnMeta } from '../models/dynamic-aggrid.model';

describe('DynamicAggridService', () => {
  let service: DynamicAggridService;
  const names = DYNAMIC_FRAMEWORK_COMPONENTS;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [DynamicAggridService] });
    service = TestBed.inject(DynamicAggridService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('maps a text column with an editor when editable', () => {
    const cols: ColumnMeta[] = [{ field: 'name', headerName: 'Name', type: 'text', editable: true }];
    const [def] = service.buildColumnDefs(cols);
    expect(def.field).toBe('name');
    expect(def.headerName).toBe('Name');
    expect(def.editable).toBeTrue();
    expect(def.cellEditor).toBe(names.textEditor);
  });

  it('does not attach an editor to a non-editable column', () => {
    const [def] = service.buildColumnDefs([{ field: 'name', type: 'text' }]);
    expect(def.cellEditor).toBeUndefined();
  });

  it('resolves the numeric editor for number columns', () => {
    const [def] = service.buildColumnDefs([
      { field: 'amt', type: 'number', editable: true, editorParams: { min: 0 } },
    ]);
    expect(def.cellEditor).toBe(names.numericEditor);
    expect(def.cellEditorParams).toEqual({ min: 0 });
  });

  it('resolves dropdown renderer + popup editor with options', () => {
    const options = [{ label: 'A', value: 'a' }];
    const [def] = service.buildColumnDefs([
      { field: 'status', type: 'dropdown', editable: true, options },
    ]);
    expect(def.cellRenderer).toBe(names.dropdownRenderer);
    expect(def.cellEditor).toBe(names.dropdownEditor);
    expect(def.cellEditorPopup).toBeTrue();
    expect((def.cellEditorParams as { options: unknown }).options).toEqual(options);
  });

  it('resolves the checkbox renderer and no separate editor', () => {
    const [def] = service.buildColumnDefs([{ field: 'active', type: 'checkbox', editable: true }]);
    expect(def.cellRenderer).toBe(names.checkboxRenderer);
    expect(def.cellEditor).toBeUndefined();
  });

  it('builds an action column that is not sortable/filterable by default', () => {
    const [def] = service.buildColumnDefs([
      { field: 'actions', type: 'action', actions: [{ id: 'edit', icon: 'pi pi-pencil' }] },
    ]);
    expect(def.cellRenderer).toBe(names.actionRenderer);
    expect(def.sortable).toBeFalse();
    expect(def.filter).toBeFalse();
  });

  it('applies the colored-text renderer when a colorMap is present', () => {
    const [def] = service.buildColumnDefs([
      { field: 'status', type: 'text', colorMap: { open: 'green' } },
    ]);
    expect(def.cellRenderer).toBe(names.textColorRenderer);
  });

  it('honours explicit renderer/editor overrides', () => {
    const [def] = service.buildColumnDefs([
      { field: 'x', type: 'text', editable: true, renderer: 'myRenderer', editor: 'myEditor' },
    ]);
    expect(def.cellRenderer).toBe('myRenderer');
    expect(def.cellEditor).toBe('myEditor');
  });

  it('merges the native colDef escape hatch last', () => {
    const [def] = service.buildColumnDefs([
      { field: 'x', type: 'text', width: 100, colDef: { width: 250, pinned: 'left' } },
    ]);
    expect(def.width).toBe(250);
    expect(def.pinned).toBe('left');
  });

  it('builds the framework-components map with op-aggrid classes', () => {
    const map = service.buildFrameworkComponents();
    expect(map[names.textEditor]).toBe(TextEditorComponent);
    expect(map[names.numericEditor]).toBe(NumericEditorComponent);
    expect(map[names.dropdownEditor]).toBe(OccDropdownEditorComponent);
    expect(map[names.checkboxRenderer]).toBe(CheckboxRendererComponent);
    expect(map[names.actionRenderer]).toBe(ActionRendererComponent);
  });

  it('assembles client-side grid options by default', () => {
    const opts = service.buildGridOptions({});
    expect(opts.rowModelType).toBe('clientSide');
    expect(opts.defaultColDef?.resizable).toBeTrue();
  });

  it('wires server-side flags and cache block size', () => {
    const opts = service.buildGridOptions({
      rowModelType: 'serverSide',
      cacheBlockSize: 50,
      enableServerSideSorting: true,
      enableServerSideFilter: true,
    });
    expect(opts.rowModelType).toBe('serverSide');
    expect(opts.cacheBlockSize).toBe(50);
    expect(opts.serverSideSortAllLevels).toBeTrue();
    expect(opts.serverSideFilterAllLevels).toBeTrue();
  });

  it('enables pagination with a page size', () => {
    const opts = service.buildGridOptions({ pagination: true, paginationPageSize: 25 });
    expect(opts.pagination).toBeTrue();
    expect(opts.paginationPageSize).toBe(25);
  });
});
