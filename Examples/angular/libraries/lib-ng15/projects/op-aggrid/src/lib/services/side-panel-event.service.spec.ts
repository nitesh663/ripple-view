import { TestBed } from '@angular/core/testing';

import { SidePanelEventService } from './side-panel-event.service';

describe('SidePanelEventService', () => {
  let service: SidePanelEventService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [SidePanelEventService] });
    service = TestBed.inject(SidePanelEventService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('broadcasts panel events', (done) => {
    service.panelEvents.subscribe((e) => {
      expect(e).toEqual({ panelId: 'filters', open: true });
      done();
    });
    service.emit({ panelId: 'filters', open: true });
  });
});
