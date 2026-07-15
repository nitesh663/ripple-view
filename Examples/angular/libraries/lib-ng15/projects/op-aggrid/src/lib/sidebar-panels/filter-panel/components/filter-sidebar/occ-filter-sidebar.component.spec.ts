import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { OccFilterSidebarComponent } from './occ-filter-sidebar.component';
import { SavedFilterService } from '../../services/saved-filter.service';
import { StickyFilterService } from '../../services/sticky-filter.service';
import { KVPair } from '../../../../models/kv-pair.model';

describe('OccFilterSidebarComponent', () => {
  let component: OccFilterSidebarComponent;
  let fixture: ComponentFixture<OccFilterSidebarComponent>;
  let savedFilterService: jasmine.SpyObj<SavedFilterService>;
  let stickyFilterService: jasmine.SpyObj<StickyFilterService>;

  const meta: KVPair[] = [{ key: 'status', value: 'Status', type: 'input' }];

  beforeEach(async () => {
    savedFilterService = jasmine.createSpyObj('SavedFilterService', ['getByPanel', 'save', 'remove', 'load']);
    savedFilterService.getByPanel.and.returnValue(of([]));
    stickyFilterService = jasmine.createSpyObj('StickyFilterService', ['get', 'set', 'clear']);
    stickyFilterService.get.and.returnValue(null);

    await TestBed.configureTestingModule({
      declarations: [OccFilterSidebarComponent],
      imports: [TranslateModule.forRoot()],
      providers: [
        { provide: SavedFilterService, useValue: savedFilterService },
        { provide: StickyFilterService, useValue: stickyFilterService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(OccFilterSidebarComponent);
    component = fixture.componentInstance;
    component.filterMeta = meta;
    component.filterBarPanelId = 'orders';
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('emits selection changes from the form', () => {
    const spy = jasmine.createSpy('sel');
    component.onSelectionChange.subscribe(spy);
    fixture.detectChanges();
    component.onFormValueChange({ status: 'open' });
    expect(spy).toHaveBeenCalledWith({ status: 'open' });
    expect(component.currentValues).toEqual({ status: 'open' });
  });

  it('applies the filter and persists sticky values when enabled', () => {
    component.enableStickyFilters = true;
    fixture.detectChanges();
    const spy = jasmine.createSpy('apply');
    component.onApplyFilter.subscribe(spy);
    component.onFormValueChange({ status: 'open' });
    component.applyFilter();
    expect(spy).toHaveBeenCalledWith({ status: 'open' });
    expect(stickyFilterService.set).toHaveBeenCalledWith('orders', { status: 'open' });
  });

  it('clears all values and emits onClearAll', () => {
    fixture.detectChanges();
    const spy = jasmine.createSpy('clear');
    component.onClearAll.subscribe(spy);
    component.onFormValueChange({ status: 'open' });
    component.clearAll();
    expect(component.currentValues).toEqual({});
    expect(spy).toHaveBeenCalled();
  });

  it('saves a configuration through the saved-filter service', () => {
    fixture.detectChanges();
    component.saveConfiguration({ name: 'A', filterBarPanelId: 'orders', values: {} });
    expect(savedFilterService.save).toHaveBeenCalled();
    expect(component.showSaveForm).toBeFalse();
  });

  it('seeds initial values from applySelectedFilter', () => {
    component.applySelectedFilter = { status: 'closed' };
    component.ngOnInit();
    expect(component.initialValues).toEqual({ status: 'closed' });
  });
});
