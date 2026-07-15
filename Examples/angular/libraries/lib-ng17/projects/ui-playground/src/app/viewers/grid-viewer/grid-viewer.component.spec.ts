import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StoreModule } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';

import { GridViewerComponent } from './grid-viewer.component';

describe('GridViewerComponent', () => {
  let component: GridViewerComponent;
  let fixture: ComponentFixture<GridViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GridViewerComponent],
      imports: [FormsModule, StoreModule.forRoot({}), TranslateModule.forRoot()],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(GridViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('builds columns, rows and a sidebar definition', () => {
    expect(component.columnDefs.length).toBeGreaterThan(0);
    expect(component.rowData.length).toBe(5);
    expect(component.sidebarDef).toBeTruthy();
  });

  it('drops the sidebar when toggled off', () => {
    component.showSidebar = false;
    component.rebuildSidebar();
    expect(component.sidebarDef).toBeUndefined();
  });
});
