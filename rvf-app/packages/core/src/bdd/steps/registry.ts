import type { StepMatch, StepPattern } from './types.js';
import { ALL_CATALOG_PATTERNS } from './catalog/index.js';

/**
 * Matches Gherkin step text against the universal step catalog.
 *
 * G11: Plugin-injectable extra patterns extend the vocabulary without
 *      editing core. Pass custom StepPattern[] to the constructor.
 */
export class StepRegistry {
  private readonly patterns: readonly StepPattern[];

  constructor(extra: StepPattern[] = []) {
    this.patterns = [...ALL_CATALOG_PATTERNS, ...extra];
  }

  /**
   * Match a step text string against all registered patterns.
   * Returns the first match, or null if no pattern matches.
   */
  match(stepText: string): StepMatch | null {
    for (const sp of this.patterns) {
      const m = sp.pattern.exec(stepText);
      if (m !== null) {
        return { action: sp.action, params: sp.extractParams(m) };
      }
    }
    return null;
  }

  /** Total number of registered patterns (catalog + extras). */
  get size(): number {
    return this.patterns.length;
  }
}
