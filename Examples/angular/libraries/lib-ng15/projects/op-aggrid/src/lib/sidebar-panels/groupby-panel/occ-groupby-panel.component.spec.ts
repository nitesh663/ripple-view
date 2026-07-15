import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Column, IToolPanelParams } from '@ag-grid-community/core';

import { OccGroupbyPanelComponent } from './occ-groupby-panel.component';

describe('OccGroupbyPanelComponent', () => {
  let component: OccGroupbyPanelComponent;
  let fixture: ComponentFixture<OccGroupbyPanelComponent>;

  function mockColumn(colId: string, grouped: boolean): Column {
    return {
      getColId: () => colId,
      isRowGroupActive: () => grouped,
      getColDef: () => ({ headerName: colId }),
    } as unknown as Column;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OccGroupbyPanelComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(OccGroupbyPanelComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('adds a row group when toggled on', () => {
    const addRowGroupColumn = jasmine.createSpy('addRowGroupColumn');
    const col = mockColumn('a', false);
    component.agInit({
      columnApi: { getColumns: () => [col], addRowGroupColumn, removeRowGroupColumn: () => {} },
    } as unknown as IToolPanelParams);
    const target = document.createElement('input');
    target.checked = true;
    component.toggleGroup(col, { target } as unknown as Event);
    expect(addRowGroupColumn).toHaveBeenCalledWith('a');
  });

  it('removes a row group when toggled off', () => {
    const removeRowGroupColumn = jasmine.createSpy('removeRowGroupColumn');
    const col = mockColumn('a', true);
    component.agInit({
      columnApi: { getColumns: () => [col], addRowGroupColumn: () => {}, removeRowGroupColumn },
    } as unknown as IToolPanelParams);
    const target = document.createElement('input');
    target.checked = false;
    component.toggleGroup(col, { target } as unknown as Event);
    expect(removeRowGroupColumn).toHaveBeenCalledWith('a');
  });
});
