import { Injectable } from '@angular/core';

/**
 * Persists the last-applied filter values per panel to `localStorage` so a panel
 * can re-open with the user's previous selection ("sticky" filters). Degrades to a
 * no-op when storage is unavailable.
 */
@Injectable({ providedIn: 'root' })
export class StickyFilterService {
  private readonly prefix = 'op-sticky-filter:';

  /** Store the values for a panel. */
  set(panelId: string, values: Record<string, unknown>): void {
    try {
      localStorage.setItem(this.prefix + panelId, JSON.stringify(values));
    } catch {
      /* storage unavailable — ignore */
    }
  }

  /** Read the stored values for a panel, or null if none/parse failed. */
  get(panelId: string): Record<string, unknown> | null {
    try {
      const raw = localStorage.getItem(this.prefix + panelId);
      return raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }

  /** Clear the stored values for a panel. */
  clear(panelId: string): void {
    try {
      localStorage.removeItem(this.prefix + panelId);
    } catch {
      /* ignore */
    }
  }
}
