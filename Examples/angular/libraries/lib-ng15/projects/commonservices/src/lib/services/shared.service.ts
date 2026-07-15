import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

/**
 * Minimal cross-library state bus. Controls and host apps push boolean state
 * changes (e.g. a panel opened/closed, busy/idle) and subscribe to react.
 *
 * Intentionally tiny for Milestone 1 — only what the controls need.
 */
@Injectable({ providedIn: 'root' })
export class SharedService {
  private readonly state$ = new Subject<boolean>();

  /** Stream of boolean state changes. */
  get state(): Observable<boolean> {
    return this.state$.asObservable();
  }

  /** Emit a new boolean state to all subscribers. */
  stateChange(value: boolean): void {
    this.state$.next(value);
  }
}
