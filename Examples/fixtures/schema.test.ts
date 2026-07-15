/**
 * Tests for  T-17.1.2 — the FixturesManifest oracle schema.
 *
 * AC-2: schema enumerates verdict/findingClass/confidence/drift correctly
 *       and rejects malformed entries.
 * AC-3: signal-coverage — every committed fixtures.manifest.json must have
 *       at least one entry per SIGNALS tag.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { FixtureEntrySchema, FixturesManifestSchema, SIGNALS } from './schema.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');

function baseEntry(overrides: Record<string, unknown> = {}) {
  return {
    id: 'fx-1',
    app: { name: 'orders-app', framework: 'angular', generation: '17', path: 'angular/apps/ng-17/orders-app' },
    library: { name: '@op/ng-datagrid', version: '17.1.0', path: 'angular/libraries/lib-ng17/data-grid' },
    expectedVerdict: 'pass',
    expectedFindingClass: 'none',
    expectedConfidence: 'high',
    expectedDrift: 'none',
    signal: 'drift-only',
    notes: 'Compatible minor bump; no behavior change.',
    ...overrides,
  };
}

describe('FixtureEntrySchema — AC-2 valid shapes', () => {
  it('accepts a minimal valid pass entry', () => {
    const result = FixtureEntrySchema.safeParse(baseEntry());
    expect(result.success).toBe(true);
  });

  it('accepts every documented signal tag', () => {
    for (const signal of SIGNALS) {
      const result = FixtureEntrySchema.safeParse(baseEntry({ signal }));
      expect(result.success).toBe(true);
    }
  });

  it('defaults acceptedBug and neverGated to false when omitted', () => {
    const result = FixtureEntrySchema.parse(baseEntry());
    expect(result.acceptedBug).toBe(false);
    expect(result.neverGated).toBe(false);
  });
});

describe('FixtureEntrySchema — AC-2 rejects malformed entries', () => {
  it('rejects an unknown expectedVerdict', () => {
    const result = FixtureEntrySchema.safeParse(baseEntry({ expectedVerdict: 'maybe' }));
    expect(result.success).toBe(false);
  });

  it('rejects an unknown signal tag', () => {
    const result = FixtureEntrySchema.safeParse(baseEntry({ signal: 'not-a-real-signal' }));
    expect(result.success).toBe(false);
  });

  it('rejects a missing notes field', () => {
    const { notes, ...withoutNotes } = baseEntry();
    const result = FixtureEntrySchema.safeParse(withoutNotes);
    expect(result.success).toBe(false);
  });

  it('rejects an empty notes string', () => {
    const result = FixtureEntrySchema.safeParse(baseEntry({ notes: '' }));
    expect(result.success).toBe(false);
  });

  it('rejects neverGated:true paired with a non-unknown confidence (design)', () => {
    const result = FixtureEntrySchema.safeParse(
      baseEntry({ neverGated: true, expectedConfidence: 'low' }),
    );
    expect(result.success).toBe(false);
  });

  it('accepts neverGated:true paired with expectedConfidence "unknown"', () => {
    const result = FixtureEntrySchema.safeParse(
      baseEntry({ neverGated: true, expectedConfidence: 'unknown' }),
    );
    expect(result.success).toBe(true);
  });
});

// AC-1: layout convention — libraries are a whole SIBLING directory per
// generation (angular/libraries/lib-ng17/data-grid); apps nest the
// generation as its own directory level (angular/apps/ng-17/orders-app,
// — one real multi-project Angular CLI workspace per generation).
describe('FixtureEntrySchema — AC-1 layout convention (apps nest by generation)', () => {
  it('accepts a react app/library pair on the matching convention', () => {
    const result = FixtureEntrySchema.safeParse(
      baseEntry({
        app: { name: 'settings-app', framework: 'react', generation: '18', path: 'react/apps/r-18/settings-app' },
        library: { name: '@op/react-multiselect', version: '18.2.0', path: 'react/libraries/lib-r18/multi-select' },
      }),
    );
    expect(result.success).toBe(true);
  });

  it('rejects an app.path using an unrelated wrong nested shape', () => {
    const result = FixtureEntrySchema.safeParse(
      baseEntry({ app: { name: 'orders-app', framework: 'angular', generation: '17', path: 'apps/angular/17/orders-app' } }),
    );
    expect(result.success).toBe(false);
  });

  it('rejects an app.path missing the generation directory entirely', () => {
    const result = FixtureEntrySchema.safeParse(
      baseEntry({ app: { name: 'orders-app', framework: 'angular', generation: '17', path: 'angular/apps/orders-app' } }),
    );
    expect(result.success).toBe(false);
  });

  it('rejects an app.path whose generation directory disagrees with app.generation', () => {
    const result = FixtureEntrySchema.safeParse(
      baseEntry({ app: { name: 'orders-app', framework: 'angular', generation: '15', path: 'angular/apps/ng-17/orders-app' } }),
    );
    expect(result.success).toBe(false);
  });

  it('rejects a library.path under the wrong framework for the consuming app', () => {
    const result = FixtureEntrySchema.safeParse(
      baseEntry({ library: { name: '@op/react-datagrid', version: '18.0.0', path: 'react/libraries/lib-r18/data-grid' } }),
    );
    expect(result.success).toBe(false);
  });

  it('rejects a library.path whose lib-<gen> segment disagrees with the candidate version major', () => {
    const result = FixtureEntrySchema.safeParse(
      baseEntry({ library: { name: '@op/ng-datagrid', version: '15.0.0', path: 'angular/libraries/lib-ng17/data-grid' } }),
    );
    expect(result.success).toBe(false);
  });
});

describe('fixtures.manifest.json — AC-2/AC-3: the committed oracle itself', () => {
  const raw = JSON.parse(readFileSync(join(repoRoot, 'fixtures.manifest.json'), 'utf8'));

  it('validates against FixturesManifestSchema', () => {
    const result = FixturesManifestSchema.safeParse(raw);
    if (!result.success) {
      throw new Error(JSON.stringify(result.error.issues, null, 2));
    }
    expect(result.success).toBe(true);
  });

  it('has at least one fixture per required signal (AC-3)', () => {
    const manifest = FixturesManifestSchema.parse(raw);
    const coveredSignals = new Set(manifest.fixtures.map((f) => f.signal));
    for (const signal of SIGNALS) {
      expect(coveredSignals.has(signal)).toBe(true);
    }
  });

  it('has unique fixture ids', () => {
    const manifest = FixturesManifestSchema.parse(raw);
    const ids = manifest.fixtures.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
