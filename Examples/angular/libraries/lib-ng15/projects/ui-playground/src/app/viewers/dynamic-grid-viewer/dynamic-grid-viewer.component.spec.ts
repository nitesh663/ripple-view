import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { DynamicGridViewerComponent } from './dynamic-grid-viewer.component';

describe('DynamicGridViewerComponent', () => {
  let component: DynamicGridViewerComponent;
  let fixture: ComponentFixture<DynamicGridViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DynamicGridViewerComponent],
      imports: [FormsModule],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(DynamicGridViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('exposes metadata for the dynamic grid', () => {
    expect(component.colsMeta.length).toBe(6);
    expect(component.rowsMeta.length).toBe(5);
  });

  it('toggles filter meta with the sidebar flag', () => {
    component.showSidebar = false;
    expect(component.activeFilterMeta.length).toBe(0);
    component.showSidebar = true;
    expect(component.activeFilterMeta.length).toBeGreaterThan(0);
  });

  it('derives the page size from the pagination toggle', () => {
    expect(component.pageSize).toBeUndefined();
    component.enablePagination = true;
    expect(component.pageSize).toBe(3);
  });
});
