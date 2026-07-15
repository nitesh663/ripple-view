import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ICellRendererParams } from '@ag-grid-community/core';

import { TextColorRendererComponent } from './text-color-renderer.component';
import { TextColorRendererParams } from '../../models/grid-action.model';

describe('TextColorRendererComponent', () => {
  let component: TextColorRendererComponent;
  let fixture: ComponentFixture<TextColorRendererComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TextColorRendererComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(TextColorRendererComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the value as text', () => {
    component.agInit({ value: 'Active' } as ICellRendererParams);
    expect(component.displayValue).toBe('Active');
  });

  it('resolves colour from a static colorMap', () => {
    component.agInit({
      value: 'Active',
      colorMap: { Active: 'green' },
    } as unknown as ICellRendererParams & TextColorRendererParams);
    expect(component.color).toBe('green');
  });

  it('resolves colour from a resolver function', () => {
    component.agInit({
      value: 5,
      colorResolver: (v: unknown) => ((v as number) > 3 ? 'red' : 'blue'),
    } as unknown as ICellRendererParams & TextColorRendererParams);
    expect(component.color).toBe('red');
  });

  it('falls back to empty colour when nothing matches', () => {
    component.agInit({ value: 'X' } as ICellRendererParams);
    expect(component.color).toBe('');
  });
});
