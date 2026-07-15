import { TestBed } from '@angular/core/testing';

import { SidebarVisibilityService } from './sidebar-visibility.service';

describe('SidebarVisibilityService', () => {
  let service: SidebarVisibilityService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [SidebarVisibilityService] });
    service = TestBed.inject(SidebarVisibilityService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('opens and closes panels', () => {
    service.open('filters');
    expect(service.current).toBe('filters');
    service.close();
    expect(service.current).toBeNull();
  });

  it('toggles a panel off when re-toggled', () => {
    service.toggle('columns');
    expect(service.current).toBe('columns');
    service.toggle('columns');
    expect(service.current).toBeNull();
  });
});
