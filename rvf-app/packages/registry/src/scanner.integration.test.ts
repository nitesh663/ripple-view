import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadWorkspaceConfig } from '@rippleview/core';
import { scanRegistry } from './scanner.js';

//  DoD: "example repos produce a correct graph". rippleview-examples is a
// sibling repo (not a workspace package here), so this test resolves it by
// relative path and skips gracefully if it isn't checked out alongside rv
// — e.g. in a CI runner that only clones this one repo. Where it IS present
// (this environment, and any local dev clone following the documented repo
// layout), it's a real, non-mocked integration check against the actual
// fixture suite from –467, not synthetic data.

const EXAMPLES_ROOT = resolve(import.meta.dirname, '../../../../rippleview-examples');
const WORKSPACE_FILE = resolve(EXAMPLES_ROOT, 'rippleview.workspace.yaml');

const describeIfPresent = existsSync(WORKSPACE_FILE) ? describe : describe.skip;

describeIfPresent(
  'scanRegistry — integration against the real rippleview-examples fixture suite ( DoD)',
  () => {
    it("produces a registry matching docs/fixtures/REGISTRY_DEMO.md's per-generation consumer mapping exactly", () => {
      const workspace = loadWorkspaceConfig(WORKSPACE_FILE);

      // @enterprise/shared is deliberately excluded here — it's internal
      // plumbing core-controls depends on, not independently oracle-tracked
      // (see rippleview-examples/docs/fixtures/ARCHITECTURE.md's naming convention),
      // and its own version doesn't follow the framework-generation axis at
      // all (1.0.0/2.0.0), so it's outside REGISTRY_DEMO.md's table on purpose.
      const trackedPackages = workspace.packages.filter((name) => name !== '@enterprise/shared');

      const registry = scanRegistry({ roots: [EXAMPLES_ROOT], trackedPackages });

      // angular/15: core-controls real consumers (orders, billing, admin, brownfield).
      expect(registry.angular?.['15']?.['@enterprise/core-controls']).toEqual({
        latest: '15.2.0',
        consumers: {
          'orders-app': '15.0.0',
          'billing-app': '15.0.0',
          'admin-app': '15.0.0',
          'brownfield-app': '15.0.0',
        },
      });

      // angular/15: data-grid — only orders-app and billing-app import it
      // (never admin-app or brownfield-app) — the AC-3 "never multiselect-only
      // apps for a datagrid change" example case, proven directly from a real scan.
      expect(registry.angular?.['15']?.['@enterprise/data-grid']).toEqual({
        latest: '15.2.0',
        consumers: {
          'orders-app': '15.0.0',
          'billing-app': '15.0.0',
        },
      });

      // angular/17: data-grid's peerDependency never drifted — it buckets
      // cleanly under angular/17 with its real consumers.
      expect(registry.angular?.['17']?.['@enterprise/data-grid']).toEqual({
        latest: '17.2.0',
        consumers: {
          'orders-app': '17.0.0',
          'billing-app': '17.0.0',
        },
      });

      // angular/17: core-controls's REAL consumers are still visible and
      // still correctly bucketed by THEIR OWN @angular/core dependency — but
      // there's no `latest`, because no library in this scan currently
      // declares an angular/17 peer dependency for core-controls anymore.
      expect(registry.angular?.['17']?.['@enterprise/core-controls']).toEqual({
        latest: '',
        consumers: {
          'orders-app': '17.0.0',
          'billing-app': '17.0.0',
          'admin-app': '17.0.0',
        },
      });

      // angular/18: the real, verified build/peer-dep-break regression
      // () — core-controls@17.2.0 declares peerDependencies
      // @angular/core ^18.0.0, so the registry correctly files it under
      // angular/18 (what it now CLAIMS to target), with zero real consumers
      // there (no app can even install it — confirmed via a real ERESOLVE
      // failure during ). This drift IS the signal: a real impact-
      // selection pass () must NOT treat angular/17 consumers as
      // having a viable upgrade path to this candidate.
      expect(registry.angular?.['18']).toEqual({
        '@enterprise/core-controls': { latest: '17.2.0', consumers: {} },
      });

      // react/19: a completely separate framework namespace. Includes every
      // real consumer of the package, including the library's own playground
      // demo app — the registry doesn't distinguish "demo" from "production"
      // consumers, it just records who declares the dependency.
      expect(registry.react?.['19']?.['@enterprise/react-core-controls']).toEqual({
        latest: '19.2.0',
        consumers: {
          'orders-app': '19.0.0',
          'settings-app': '19.0.0',
          'react-r19-playground': '19.0.0',
        },
      });

      // Never cross-contaminated: angular and react stay fully separate namespaces.
      expect(registry.react?.['15']).toBeUndefined();
      expect(registry.react?.['17']).toBeUndefined();
      expect(registry.angular?.['19']).toBeUndefined();
    });

    it('also scans cleanly with the full tracked-package list (including @enterprise/shared)', () => {
      const workspace = loadWorkspaceConfig(WORKSPACE_FILE);
      const registry = scanRegistry({
        roots: [EXAMPLES_ROOT],
        trackedPackages: workspace.packages,
      });

      // shared is a real dependency of core-controls (a library depending on
      // another library, not an app). Its OWN version (1.0.0/2.0.0) doesn't
      // follow the framework-generation axis, so it buckets by ITS peer
      // dependency on @angular/core, same rule as every other tracked library.
      expect(registry.angular?.['15']?.['@enterprise/shared']?.latest).toBe('1.0.0');
      expect(registry.angular?.['17']?.['@enterprise/shared']?.latest).toBe('2.0.0');
    });
  },
);
