import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { GridApi, GridReadyEvent } from '@ag-grid-community/core';
import { GenericAggridConfgProvider } from '@op/aggrid';

import { DynamicAggridComponent } from './dynamic-aggrid.component';
import { DynamicAggridService } from '../../services/dynamic-aggrid.service';
import { ColumnMeta } from '../../models/dynamic-aggrid.model';

describe('DynamicAggridComponent', () => {
  let component: DynamicAggridComponent;
  let fixture: ComponentFixture<DynamicAggridComponent>;

  const cols: ColumnMeta[] = [
    { field: 'name', headerName: 'Name', type: 'text', editable: true },
    { field: 'amount', headerName: 'Amount', type: 'number', editable: true },
  ];
  const rows = [{ name: 'Ann', amount: 10 }];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DynamicAggridComponent],
      providers: [DynamicAggridService, GenericAggridConfgProvider],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(DynamicAggridComponent);
    component = fixture.componentInstance;
    component.colsMeta = cols;
    component.rowsMeta = rows;
    fixture.detectChanges();
  });

  it('should create and render occ-aggrid', () => {
    expect(component).toBeTruthy();
    expect(fixture.nativeElement.querySelector('occ-aggrid')).toBeTruthy();
  });

  it('builds columnDefs, rowData and frameworkComponents from metadata', () => {
    expect(component.columnDefs.length).toBe(2);
    expect(component.rowData).toEqual(rows);
    expect(Object.keys(component.frameworkComponents).length).toBeGreaterThan(0);
  });

  it('clears rowData for non-clientSide models', () => {
    component.rowModelType = 'infinite';
    component.ngOnChanges({ rowModelType: {} as never });
    expect(component.rowData).toBeNull();
  });

  it('builds a sidebar def from filterMeta', () => {
    component.filterMeta = [{ key: 'name', value: 'Name', type: 'input' }];
    component.ngOnChanges({ filterMeta: {} as never });
    expect(component.effectiveSidebarDef).toBeTruthy();
  });

  it('applies a header checkbox to the first data column when requested', () => {
    component.headerCheckboxSelection = true;
    component.ngOnChanges({ headerCheckboxSelection: {} as never });
    expect(component.columnDefs[0].headerCheckboxSelection).toBeTrue();
    expect(component.columnDefs[0].checkboxSelection).toBeTrue();
  });

  it('emits fetchData for infinite row model on gridReady', () => {
    const spy = jasmine.createSpy('fetchData');
    component.fetchData.subscribe(spy);
    component.rowModelType = 'infinite';
    component.ngOnChanges({ rowModelType: {} as never });

    let captured: { getRows: (p: unknown) => void } | undefined;
    const api = {
      setDatasource: (ds: { getRows: (p: unknown) => void }) => (captured = ds),
    } as unknown as GridApi;
    component.onGridReady({ api } as GridReadyEvent);

    captured?.getRows({
      startRow: 0,
      endRow: 100,
      sortModel: [],
      filterModel: {},
      successCallback: () => {},
      failCallback: () => {},
    });
    expect(spy).toHaveBeenCalled();
  });

  it('re-emits gridReady', () => {
    const spy = jasmine.createSpy('gridReady');
    component.gridReady.subscribe(spy);
    component.onGridReady({ api: {} as GridApi } as GridReadyEvent);
    expect(spy).toHaveBeenCalled();
  });
});
