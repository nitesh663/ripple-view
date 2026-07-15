import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ICellRendererParams } from '@ag-grid-community/core';

import { OccDropdownRendererComponent } from './occ-dropdown-renderer.component';
import { DropdownCellParams } from '../../models/grid-action.model';

describe('OccDropdownRendererComponent', () => {
  let component: OccDropdownRendererComponent;
  let fixture: ComponentFixture<OccDropdownRendererComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OccDropdownRendererComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(OccDropdownRendererComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('maps options and seeds the value', () => {
    component.agInit({
      value: 'b',
      options: [
        { label: 'A', value: 'a' },
        { label: 'B', value: 'b' },
      ],
    } as unknown as ICellRendererParams & DropdownCellParams);
    expect(component.options.length).toBe(2);
    expect(component.value).toBe('b');
  });

  it('writes the selection back to the row', () => {
    const setDataValue = jasmine.createSpy('setDataValue');
    component.agInit({
      value: 'a',
      options: [{ label: 'A', value: 'a' }],
      colDef: { field: 'status' },
      node: { setDataValue },
    } as unknown as ICellRendererParams & DropdownCellParams);
    component.onValueChange({ value: 'a' });
    expect(setDataValue).toHaveBeenCalledWith('status', 'a');
  });
});
