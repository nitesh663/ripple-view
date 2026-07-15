import { TestBed } from '@angular/core/testing';

import { StickyFilterService } from './sticky-filter.service';

describe('StickyFilterService', () => {
  let service: StickyFilterService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [StickyFilterService] });
    service = TestBed.inject(StickyFilterService);
    localStorage.clear();
  });

  it('round-trips values through storage', () => {
    service.set('orders', { status: 'open' });
    expect(service.get('orders')).toEqual({ status: 'open' });
  });

  it('returns null when nothing is stored', () => {
    expect(service.get('missing')).toBeNull();
  });

  it('clears stored values', () => {
    service.set('orders', { a: 1 });
    service.clear('orders');
    expect(service.get('orders')).toBeNull();
  });
});
