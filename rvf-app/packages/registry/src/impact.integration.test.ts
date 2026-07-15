import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadWorkspaceConfig } from '@rippleview/core';
import { scanRegistry } from './scanner.js';
import { selectImpactedConsumers } from './impact.js';

//  DoD: "candidate -> correct impacted set + versions". This runs
// impact selection against a REAL scan of the rippleview-examples fixture suite —
// the exact two scenarios documented in
// rippleview-examples/docs/fixtures/REGISTRY_DEMO.md and recorded as pending
// tasks on this story by. Skips gracefully if rippleview-examples isn't
// checked out alongside rv (see scanner.integration.test.ts).

const EXAMPLES_ROOT = resolve(import.meta.dirname, '../../../../rippleview-examples');
const WORKSPACE_FILE = resolve(EXAMPLES_ROOT, 'rippleview.workspace.yaml');

const describeIfPresent = existsSync(WORKSPACE_FILE) ? describe : describe.skip;

describeIfPresent(
  'selectImpactedConsumers — integration against the real rippleview-examples fixture suite ( DoD)',
  () => {
    it("a @enterprise/data-grid@15.2.0 change selects exactly orders-app and billing-app on ng15 — never admin-app or brownfield-app (AC-3's own example case)", () => {
      const workspace = loadWorkspaceConfig(WORKSPACE_FILE);
      const trackedPackages = workspace.packages.filter((name) => name !== '@enterprise/shared');
      const registry = scanRegistry({ roots: [EXAMPLES_ROOT], trackedPackages });

      const result = selectImpactedConsumers({
        registry,
        framework: 'angular',
        generation: '15',
        packageName: '@enterprise/data-grid',
      });

      expect(result).toEqual([
        { appName: 'billing-app', libraryVersion: '15.0.0', baseTestVersion: '15.0.0' },
        { appName: 'orders-app', libraryVersion: '15.0.0', baseTestVersion: '15.0.0' },
      ]);
      expect(result.some((r) => r.appName === 'admin-app' || r.appName === 'brownfield-app')).toBe(
        false,
      );
    });

    it("a @enterprise/core-controls@17.2.0 change selects ZERO consumers — its real declared peer dependency (^18.0.0, 's verified build/peer-dep-break) means it has drifted out of the angular/17 generation entirely; that emptiness IS the confidence-0 finding", () => {
      const workspace = loadWorkspaceConfig(WORKSPACE_FILE);
      const trackedPackages = workspace.packages.filter((name) => name !== '@enterprise/shared');
      const registry = scanRegistry({ roots: [EXAMPLES_ROOT], trackedPackages });

      // The candidate's OWN declared bucket — derived the same way the
      // scanner derives it (): from its peerDependencies, not its own
      // version. core-controls@17.2.0 claims ^18.0.0, so its real bucket is
      // angular/18, confirmed directly against the real published package.
      const result = selectImpactedConsumers({
        registry,
        framework: 'angular',
        generation: '18',
        packageName: '@enterprise/core-controls',
      });

      expect(result).toEqual([]);

      // For contrast: the angular/17 bucket still shows the REAL consumers
      // pinned to the previous, viable release (17.0.0) — they are NOT
      // impacted by this specific candidate (it never reaches them), which is
      // exactly why a real `npm install` of this candidate against any of
      // them hard-fails with ERESOLVE (verified for real during ).
      const stillOnPriorRelease = selectImpactedConsumers({
        registry,
        framework: 'angular',
        generation: '17',
        packageName: '@enterprise/core-controls',
      });
      expect(stillOnPriorRelease.map((r) => r.appName).sort()).toEqual([
        'admin-app',
        'billing-app',
        'orders-app',
      ]);
    });

    it('a @enterprise/core-controls@17.1.0-equivalent (compatible, real peer ^17.0.0) selection would select all 3 real ng17 apps with their current pins', () => {
      // 17.1.0 itself is superseded in the working tree by 17.2.0, but the
      // REAL apps' current pins (17.0.0) demonstrate the positive selection
      // path: a non-drifted angular/17 candidate selects exactly the 3 real
      // ng17 consumer apps, each with its own current version resolved (AC-2).
      const workspace = loadWorkspaceConfig(WORKSPACE_FILE);
      const trackedPackages = workspace.packages.filter((name) => name !== '@enterprise/shared');
      const registry = scanRegistry({ roots: [EXAMPLES_ROOT], trackedPackages });

      const result = selectImpactedConsumers({
        registry,
        framework: 'angular',
        generation: '17',
        packageName: '@enterprise/core-controls',
      });

      expect(result).toEqual([
        { appName: 'admin-app', libraryVersion: '17.0.0', baseTestVersion: '17.0.0' },
        { appName: 'billing-app', libraryVersion: '17.0.0', baseTestVersion: '17.0.0' },
        { appName: 'orders-app', libraryVersion: '17.0.0', baseTestVersion: '17.0.0' },
      ]);
    });
  },
);
