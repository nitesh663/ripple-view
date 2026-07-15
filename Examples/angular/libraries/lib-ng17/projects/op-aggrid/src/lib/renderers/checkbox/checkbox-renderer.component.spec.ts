import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ICellRendererParams } from '@ag-grid-community/core';

import { CheckboxRendererComponent } from './checkbox-renderer.component';

describe('CheckboxRendererComponent', () => {
  let component: CheckboxRendererComponent;
  let fixture: ComponentFixture<CheckboxRendererComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CheckboxRendererComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(CheckboxRendererComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('reflects the boolean value', () => {
    component.agInit({ value: true } as ICellRendererParams);
    expect(component.checked).toBeTrue();
  });

  it('writes back to the row when editable and toggled', () => {
    const setDataValue = jasmine.createSpy('setDataValue');
    component.agInit({
      value: false,
      editable: true,
      colDef: { field: 'done' },
      node: { setDataValue },
    } as unknown as ICellRendererParams & { editable: boolean });
    const target = document.createElement('input');
    target.type = 'checkbox';
    target.checked = true;
    component.onToggle({ target } as unknown as Event);
    expect(setDataValue).toHaveBeenCalledWith('done', true);
  });

  it('ignores toggles when not editable', () => {
    const setDataValue = jasmine.createSpy('setDataValue');
    component.agInit({
      value: false,
      editable: false,
      colDef: { field: 'done' },
      node: { setDataValue },
    } as unknown as ICellRendererParams & { editable: boolean });
    const target = document.createElement('input');
    target.checked = true;
    component.onToggle({ target } as unknown as Event);
    expect(setDataValue).not.toHaveBeenCalled();
  });
});
