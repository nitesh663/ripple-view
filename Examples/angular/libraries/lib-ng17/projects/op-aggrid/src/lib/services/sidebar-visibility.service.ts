import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/**
 * Tracks which side-bar tool panel is currently open (if any) and exposes it as
 * observable state so multiple consumers can react without coupling to AG Grid's
 * imperative side-bar API.
 */
@Injectable({ providedIn: 'root' })
export class SidebarVisibilityService {
  private readonly openPanel$ = new BehaviorSubject<string | null>(null);

  /** Currently open panel id, or null when the side bar is collapsed. */
  readonly openPanel = this.openPanel$.asObservable();

  /** Mark a panel as open. */
  open(panelId: string): void {
    this.openPanel$.next(panelId);
  }

  /** Collapse the side bar. */
  close(): void {
    this.openPanel$.next(null);
  }

  /** Toggle a panel; closes if it is already the open one. */
  toggle(panelId: string): void {
    this.openPanel$.next(this.openPanel$.value === panelId ? null : panelId);
  }

  /** Current open panel id synchronously. */
  get current(): string | null {
    return this.openPanel$.value;
  }
}
