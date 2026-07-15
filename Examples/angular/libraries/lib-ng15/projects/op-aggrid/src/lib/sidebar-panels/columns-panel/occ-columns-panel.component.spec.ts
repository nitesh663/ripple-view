import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Column, IToolPanelParams } from '@ag-grid-community/core';

import { OccColumnsPanelComponent } from './occ-columns-panel.component';

describe('OccColumnsPanelComponent', () => {
  let component: OccColumnsPanelComponent;
  let fixture: ComponentFixture<OccColumnsPanelComponent>;

  function mockColumn(colId: string, visible: boolean): Column {
    return {
      getColId: () => colId,
      isVisible: () => visible,
      getColDef: () => ({ headerName: colId.toUpperCase() }),
    } as unknown as Column;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OccColumnsPanelComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(OccColumnsPanelComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('lists columns from the column api', () => {
    const cols = [mockColumn('a', true), mockColumn('b', false)];
    component.agInit({
      columnApi: { getColumns: () => cols },
    } as unknown as IToolPanelParams);
    expect(component.columns.length).toBe(2);
    expect(component.headerName(cols[0])).toBe('A');
  });

  it('toggles visibility through the column api', () => {
    const setColumnVisible = jasmine.createSpy('setColumnVisible');
    const col = mockColumn('a', true);
    component.agInit({
      columnApi: { getColumns: () => [col], setColumnVisible },
    } as unknown as IToolPanelParams);
    const target = document.createElement('input');
    target.checked = false;
    component.toggle(col, { target } as unknown as Event);
    expect(setColumnVisible).toHaveBeenCalledWith('a', false);
  });
});
