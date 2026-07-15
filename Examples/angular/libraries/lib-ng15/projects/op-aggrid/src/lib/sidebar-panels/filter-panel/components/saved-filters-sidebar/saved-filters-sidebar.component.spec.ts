import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { SavedFiltersSidebarComponent } from './saved-filters-sidebar.component';
import { SavedFilter } from '../../../../store/sidebar-filter';

describe('SavedFiltersSidebarComponent', () => {
  let component: SavedFiltersSidebarComponent;
  let fixture: ComponentFixture<SavedFiltersSidebarComponent>;

  const filters: SavedFilter[] = [
    { id: 'p::A', filterBarPanelId: 'p', name: 'A', values: {} },
    { id: 'p::B', filterBarPanelId: 'p', name: 'B', values: {}, systemDefined: true },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SavedFiltersSidebarComponent],
      imports: [TranslateModule.forRoot()],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(SavedFiltersSidebarComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('emits applyFilter when a saved filter is chosen', () => {
    const spy = jasmine.createSpy('apply');
    component.applyFilter.subscribe(spy);
    component.savedFilters = filters;
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.occ-saved-filters__apply').click();
    expect(spy).toHaveBeenCalledWith(filters[0]);
  });
});
