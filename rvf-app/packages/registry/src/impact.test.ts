import { describe, it, expect } from 'vitest';
import { selectImpactedConsumers } from './impact.js';
import type { RegistryDocument } from './types.js';

const registry: RegistryDocument = {
  angular: {
    '15': {
      '@enterprise/core-controls': {
        latest: '15.2.0',
        consumers: { 'orders-app': '15.0.0', 'admin-app': '15.0.0', 'billing-app': '15.0.0' },
      },
      '@enterprise/data-grid': {
        latest: '15.2.0',
        consumers: { 'orders-app': '15.0.0', 'billing-app': '15.0.0' },
      },
    },
    '17': {
      '@enterprise/core-controls': {
        latest: '',
        consumers: { 'orders-app': '17.0.0', 'billing-app': '17.0.0', 'admin-app': '17.0.0' },
      },
    },
    '18': {
      '@enterprise/core-controls': { latest: '17.2.0', consumers: {} },
    },
  },
  react: {
    '19': {
      '@enterprise/react-core-controls': {
        latest: '19.2.0',
        consumers: { 'orders-app': '19.0.0', 'settings-app': '19.0.0' },
      },
    },
  },
};

describe('selectImpactedConsumers — AC-1: only consumers importing the changed package are selected', () => {
  it('selects exactly the consumers of a datagrid-only change, never multiselect-only apps (the AC-3 example case)', () => {
    const result = selectImpactedConsumers({
      registry,
      framework: 'angular',
      generation: '15',
      packageName: '@enterprise/data-grid',
    });
    expect(result.map((r) => r.appName)).toEqual(['billing-app', 'orders-app']);
    // never admin-app — it doesn't import data-grid at all.
    expect(result.some((r) => r.appName === 'admin-app')).toBe(false);
  });

  it("AC-2: each selection carries the consumer's current library version AND an equal base-test version (design)", () => {
    const result = selectImpactedConsumers({
      registry,
      framework: 'angular',
      generation: '15',
      packageName: '@enterprise/core-controls',
    });
    for (const r of result) {
      expect(r.baseTestVersion).toBe(r.libraryVersion);
    }
    expect(result).toEqual([
      { appName: 'admin-app', libraryVersion: '15.0.0', baseTestVersion: '15.0.0' },
      { appName: 'billing-app', libraryVersion: '15.0.0', baseTestVersion: '15.0.0' },
      { appName: 'orders-app', libraryVersion: '15.0.0', baseTestVersion: '15.0.0' },
    ]);
  });

  it('never conflates two generations sharing the same package name and same app names (the mid-migration case)', () => {
    // orders-app/billing-app/admin-app exist under BOTH angular/15 and
    // angular/17 (the design's own mid-migration twin pattern) — same app
    // names, but each generation's selection must report ITS OWN version,
    // never the other generation's.
    const angular15 = selectImpactedConsumers({
      registry,
      framework: 'angular',
      generation: '15',
      packageName: '@enterprise/core-controls',
    });
    const angular17 = selectImpactedConsumers({
      registry,
      framework: 'angular',
      generation: '17',
      packageName: '@enterprise/core-controls',
    });
    expect(angular15.find((r) => r.appName === 'orders-app')?.libraryVersion).toBe('15.0.0');
    expect(angular17.find((r) => r.appName === 'orders-app')?.libraryVersion).toBe('17.0.0');

    const react19 = selectImpactedConsumers({
      registry,
      framework: 'react',
      generation: '19',
      packageName: '@enterprise/react-core-controls',
    });
    expect(react19.map((r) => r.appName)).toEqual(['orders-app', 'settings-app']);
  });

  it('a candidate whose declared peer dependency drifted (a real build/peer-dep-break) correctly selects ZERO consumers — that emptiness IS the confidence-0 finding, not a bug', () => {
    // core-controls@17.2.0's real bucket is angular/18 (its peerDependencies
    // claims ^18.0.0, per 's scanner) — nothing has adopted it there.
    const result = selectImpactedConsumers({
      registry,
      framework: 'angular',
      generation: '18',
      packageName: '@enterprise/core-controls',
    });
    expect(result).toEqual([]);
  });

  it('returns an empty array (never throws) for an unknown framework, generation, or package', () => {
    expect(
      selectImpactedConsumers({
        registry,
        framework: 'vue',
        generation: '3',
        packageName: 'whatever',
      }),
    ).toEqual([]);
    expect(
      selectImpactedConsumers({
        registry,
        framework: 'angular',
        generation: '99',
        packageName: '@enterprise/core-controls',
      }),
    ).toEqual([]);
    expect(
      selectImpactedConsumers({
        registry,
        framework: 'angular',
        generation: '15',
        packageName: '@enterprise/not-tracked',
      }),
    ).toEqual([]);
  });
});
