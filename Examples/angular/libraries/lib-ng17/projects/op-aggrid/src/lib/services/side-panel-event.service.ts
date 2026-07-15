import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

/** Event describing a tool-panel open/close transition. */
export interface SidePanelEvent {
  /** Tool-panel id (e.g. 'filters', 'columns', 'groupBy'). */
  panelId: string;
  /** Whether the panel is now open. */
  open: boolean;
}

/**
 * Broadcasts tool-panel open/close events between `occ-aggrid` and the custom
 * tool-panel components (which are created outside the normal component tree by
 * AG Grid's side bar).
 */
@Injectable({ providedIn: 'root' })
export class SidePanelEventService {
  private readonly events$ = new Subject<SidePanelEvent>();

  /** Stream of panel open/close events. */
  readonly panelEvents = this.events$.asObservable();

  /** Emit a panel open/close event. */
  emit(event: SidePanelEvent): void {
    this.events$.next(event);
  }
}
