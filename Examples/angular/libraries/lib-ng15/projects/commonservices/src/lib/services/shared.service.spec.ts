import { TestBed } from '@angular/core/testing';

import { SharedService } from './shared.service';

describe('SharedService', () => {
  let service: SharedService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SharedService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should emit boolean state changes to subscribers', (done: DoneFn) => {
    service.state.subscribe((value) => {
      expect(value).toBeTrue();
      done();
    });
    service.stateChange(true);
  });

  it('should deliver the latest pushed value', (done: DoneFn) => {
    const received: boolean[] = [];
    service.state.subscribe((value) => {
      received.push(value);
      if (received.length === 2) {
        expect(received).toEqual([true, false]);
        done();
      }
    });
    service.stateChange(true);
    service.stateChange(false);
  });
});
