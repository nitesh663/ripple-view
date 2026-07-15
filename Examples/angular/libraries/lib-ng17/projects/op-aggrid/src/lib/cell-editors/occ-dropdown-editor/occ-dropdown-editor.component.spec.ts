import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ICellEditorParams } from '@ag-grid-community/core';

import { OccDropdownEditorComponent } from './occ-dropdown-editor.component';
import { DropdownCellParams } from '../../models/grid-action.model';

describe('OccDropdownEditorComponent', () => {
  let component: OccDropdownEditorComponent;
  let fixture: ComponentFixture<OccDropdownEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OccDropdownEditorComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(OccDropdownEditorComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('is a popup editor', () => {
    expect(component.isPopup()).toBeTrue();
  });

  it('seeds options/value and returns the chosen value', () => {
    component.agInit({
      value: 'x',
      options: [{ label: 'X', value: 'x' }],
    } as unknown as ICellEditorParams & DropdownCellParams);
    expect(component.options.length).toBe(1);
    component.onValueChange({ value: 'y' });
    expect(component.getValue()).toBe('y');
  });
});
