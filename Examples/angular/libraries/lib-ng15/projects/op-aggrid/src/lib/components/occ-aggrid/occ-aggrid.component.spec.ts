import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ColumnApi, GridApi, GridReadyEvent } from '@ag-grid-community/core';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { OccAggridComponent } from './occ-aggrid.component';
import { AgGridStateService } from '../../services/ag-grid-state.service';

describe('OccAggridComponent', () => {
  let component: OccAggridComponent;
  let fixture: ComponentFixture<OccAggridComponent>;
  let stateService: jasmine.SpyObj<AgGridStateService>;

  beforeEach(async () => {
    stateService = jasmine.createSpyObj('AgGridStateService', ['persist', 'restore', 'selectColumnState']);
    stateService.selectColumnState.and.returnValue(of([]));
    await TestBed.configureTestingModule({
      declarations: [OccAggridComponent],
      imports: [TranslateModule.forRoot()],
      providers: [
        { provide: AgGridStateService, useValue: stateService },
        { provide: Store, useValue: jasmine.createSpyObj('Store', ['dispatch', 'select']) },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(OccAggridComponent);
    component = fixture.componentInstance;
    component.id = 'grid-1';
    component.columnDefs = [{ field: 'name' }];
    component.rowData = [{ name: 'Ann' }];
    fixture.detectChanges();
  });

  it('should create and render ag-grid-angular', () => {
    expect(component).toBeTruthy();
    expect(fixture.nativeElement.querySelector('ag-grid-angular')).toBeTruthy();
  });

  it('merges defaults and framework components into grid options', () => {
    component.frameworkComponents = { occTextEditor: class {} };
    component.ngOnInit();
    expect(component.mergedGridOptions.components?.['occTextEditor']).toBeDefined();
    expect(component.mergedGridOptions.defaultColDef?.resizable).toBeTrue();
  });

  it('restores column state and emits on gridReady', () => {
    const api = {} as GridApi;
    const columnApi = {} as ColumnApi;
    const spy = jasmine.createSpy('gridReady');
    component.gridReady.subscribe(spy);
    component.onGridReady({ api, columnApi } as GridReadyEvent);
    expect(stateService.restore).toHaveBeenCalledWith('grid-1', columnApi);
    expect(spy).toHaveBeenCalled();
  });

  it('persists column state on column moved', () => {
    const api = {} as GridApi;
    const columnApi = {} as ColumnApi;
    component.onGridReady({ api, columnApi } as GridReadyEvent);
    component.onColumnMoved({} as never);
    expect(stateService.persist).toHaveBeenCalledWith('grid-1', columnApi);
  });
});
