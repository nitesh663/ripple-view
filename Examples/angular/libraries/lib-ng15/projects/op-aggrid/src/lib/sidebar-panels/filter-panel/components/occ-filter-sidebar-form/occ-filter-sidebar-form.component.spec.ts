import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { OccFilterSidebarFormComponent } from './occ-filter-sidebar-form.component';
import { KVPair } from '../../../../models/kv-pair.model';

describe('OccFilterSidebarFormComponent', () => {
  let component: OccFilterSidebarFormComponent;
  let fixture: ComponentFixture<OccFilterSidebarFormComponent>;

  const meta: KVPair[] = [
    { key: 'status', value: 'Status', type: 'dropdown', options: [{ label: 'Open', value: 'open' }] },
    { key: 'name', value: 'Name', type: 'input' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OccFilterSidebarFormComponent],
      imports: [ReactiveFormsModule, TranslateModule.forRoot()],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(OccFilterSidebarFormComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('builds a control per field with initial values', () => {
    component.filterMeta = meta;
    component.initialValues = { status: 'open' };
    component.ngOnChanges({ filterMeta: {} as never });
    expect(component.controlFor('status').value).toBe('open');
    expect(component.controlFor('name')).toBeTruthy();
  });

  it('emits the value map on change', () => {
    let emitted: Record<string, unknown> | undefined;
    component.filterMeta = meta;
    component.ngOnChanges({ filterMeta: {} as never });
    component.valueChange.subscribe((v) => (emitted = v));
    component.controlFor('name').setValue('abc');
    component.emitValues();
    expect(emitted?.['name']).toBe('abc');
  });
});
