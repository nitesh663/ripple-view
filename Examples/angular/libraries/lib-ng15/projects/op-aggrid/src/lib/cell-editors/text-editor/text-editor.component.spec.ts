import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ICellEditorParams } from '@ag-grid-community/core';

import { TextEditorComponent } from './text-editor.component';

describe('TextEditorComponent', () => {
  let component: TextEditorComponent;
  let fixture: ComponentFixture<TextEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TextEditorComponent],
      imports: [FormsModule],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(TextEditorComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('seeds the value from params', () => {
    component.agInit({ value: 'hello' } as ICellEditorParams);
    expect(component.value).toBe('hello');
  });

  it('returns the edited value via getValue()', () => {
    component.agInit({ value: 'a' } as ICellEditorParams);
    component.value = 'edited';
    expect(component.getValue()).toBe('edited');
  });
});
