import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { scanRegistry } from './scanner.js';

// Real temp dirs, no mocks (G13) — mirrors the bundle.test.ts convention.

let root: string;

function writePackageJson(dir: string, contents: Record<string, unknown>): void {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'package.json'), JSON.stringify(contents));
}

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), 'rv-registry-scanner-'));

  // ng15 library — baseline, peer dependency matches its own version's generation.
  writePackageJson(join(root, 'angular/libraries/lib-ng15/projects/core-controls'), {
    name: '@enterprise/core-controls',
    version: '15.0.0',
    peerDependencies: { '@angular/core': '^15.2.0' },
  });

  // ng17 library — the deliberate build/peer-dep-break regression: its OWN
  // version is still 17.2.0, but its declared peerDependency now claims
  // ^18.0.0. The registry buckets by the DECLARED peer dependency (per
  // RippleView_DESIGN.md's own example: a library's bucket and its own semver
  // are independent axes) — so this is filed under angular/18, with
  // latest "17.2.0". That mismatch IS the signal, not a bug to suppress.
  writePackageJson(join(root, 'angular/libraries/lib-ng17/projects/core-controls'), {
    name: '@enterprise/core-controls',
    version: '17.2.0',
    peerDependencies: { '@angular/core': '^18.0.0' },
  });

  // ng15 consumer apps.
  writePackageJson(join(root, 'angular/apps/ng-15/orders-app'), {
    name: 'orders-app',
    dependencies: { '@angular/core': '^15.2.0', '@enterprise/core-controls': '15.0.0' },
  });
  writePackageJson(join(root, 'angular/apps/ng-15/admin-app'), {
    name: 'admin-app',
    dependencies: { '@angular/core': '^15.2.0', '@enterprise/core-controls': '15.0.0' },
  });

  // ng17 consumer app — stays pinned to @angular/core 17.x (a real consumer
  // cannot install the angular/18-targeting candidate above at all — see
  // the real ERESOLVE verification in rippleview-examples ). It still
  // shows up under angular/17 because ITS OWN dependency drives its bucket.
  writePackageJson(join(root, 'angular/apps/ng-17/orders-app'), {
    name: 'orders-app',
    dependencies: { '@angular/core': '^17.3.12', '@enterprise/core-controls': '17.0.0' },
  });

  // A react app — different framework entirely, must never be mixed into
  // the angular namespace.
  writePackageJson(join(root, 'react/apps/r-19/orders-app'), {
    name: 'orders-app',
    dependencies: { react: '^19.2.7', '@enterprise/react-core-controls': '19.0.0' },
  });

  // A consumer of an UNTRACKED package — must be invisible to the registry.
  writePackageJson(join(root, 'angular/apps/ng-15/untracked-app'), {
    name: 'untracked-app',
    dependencies: { '@angular/core': '^15.2.0', 'some-other-lib': '1.0.0' },
  });

  // node_modules must never be walked into.
  writePackageJson(
    join(root, 'angular/apps/ng-15/orders-app/node_modules/@enterprise/core-controls'),
    {
      name: '@enterprise/core-controls',
      version: '99.0.0',
    },
  );
});

afterAll(() => {
  rmSync(root, { recursive: true, force: true });
});

const trackedPackages = ['@enterprise/core-controls', '@enterprise/react-core-controls'];

describe('scanRegistry — AC-1: registry.json (framework -> library -> consumers)', () => {
  it('produces a distinct namespace per framework version (AC-2)', () => {
    const registry = scanRegistry({ roots: [root], trackedPackages });
    // angular/15 (lib + consumers), angular/17 (consumer only — see below),
    // angular/18 (lib only — the drifted peer-dep-break candidate).
    expect(Object.keys(registry.angular ?? {}).sort()).toEqual(['15', '17', '18']);
    expect(Object.keys(registry.react ?? {})).toEqual(['19']);
  });

  it('classifies the ng15 line correctly: latest + both real consumers', () => {
    const registry = scanRegistry({ roots: [root], trackedPackages });
    const entry = registry.angular?.['15']?.['@enterprise/core-controls'];
    expect(entry?.latest).toBe('15.0.0');
    expect(entry?.consumers).toEqual({
      'orders-app': '15.0.0',
      'admin-app': '15.0.0',
    });
  });

  it('buckets a build/peer-dep-break library by its DECLARED peer dependency, not its own version', () => {
    const registry = scanRegistry({ roots: [root], trackedPackages });
    // The candidate's own version (17.2.0) lands under angular/18, since
    // that's what its peerDependencies now claims to target.
    expect(registry.angular?.['18']?.['@enterprise/core-controls']).toEqual({
      latest: '17.2.0',
      consumers: {},
    });
    // The real angular/17 consumer is still visible — it has no `latest`
    // (no library in this scan declares an angular/17 peer dependency
    // anymore), but its pin is recorded: it's stuck behind, by design.
    expect(registry.angular?.['17']?.['@enterprise/core-controls']).toEqual({
      latest: '',
      consumers: { 'orders-app': '17.0.0' },
    });
  });

  it('classifies the react19 line independently of the angular lines', () => {
    const registry = scanRegistry({ roots: [root], trackedPackages });
    const entry = registry.react?.['19']?.['@enterprise/react-core-controls'];
    expect(entry?.consumers).toEqual({ 'orders-app': '19.0.0' });
  });

  it('never includes an untracked package or a node_modules-nested package.json', () => {
    const registry = scanRegistry({ roots: [root], trackedPackages });
    const all15Packages = Object.keys(registry.angular?.['15'] ?? {});
    expect(all15Packages).toEqual(['@enterprise/core-controls']);
    expect(registry.angular?.['15']?.['@enterprise/core-controls']?.latest).toBe('15.0.0');
  });
});
