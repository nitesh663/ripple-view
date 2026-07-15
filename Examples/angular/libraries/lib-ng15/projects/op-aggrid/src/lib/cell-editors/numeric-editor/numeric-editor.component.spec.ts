import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ICellEditorParams } from '@ag-grid-community/core';

import { NumericEditorComponent } from './numeric-editor.component';

describe('NumericEditorComponent', () => {
  let component: NumericEditorComponent;
  let fixture: ComponentFixture<NumericEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NumericEditorComponent],
      imports: [FormsModule],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(NumericEditorComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('seeds a numeric value from params', () => {
    component.agInit({ value: 42 } as ICellEditorParams);
    expect(component.value).toBe(42);
  });

  it('clamps the returned value to min/max', () => {
    component.agInit({ value: 5, min: 0, max: 10 } as unknown as ICellEditorParams & {
      min: number;
      max: number;
    });
    component.value = 99;
    expect(component.getValue()).toBe(10);
    component.value = -5;
    expect(component.getValue()).toBe(0);
  });

  it('returns null for empty input', () => {
    component.agInit({ value: '' } as ICellEditorParams);
    expect(component.getValue()).toBeNull();
  });
});
