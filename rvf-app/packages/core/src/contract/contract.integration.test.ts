import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadContract } from './loader.js';
import { findMissingRequiredAnchors } from './anchors.js';

//  T-8.1.2 DoD: "contract validated; used by coverage + anchors."
// RippleViewTests is a sibling repo (not a workspace package here), so this test
// resolves it by relative path and skips gracefully if it isn't checked out
// alongside rv — mirroring packages/registry/src/scanner.integration.test.ts.
//
// One contract.yaml per ACTUAL component, not per package — a package that
// bundles several components (core-controls: Button/Input/MultiSelect/Form)
// gets one file per component (see RippleViewTests/README.md's layout section),
// never one file conflating several components' anchors/states/api.

const RippleView_TESTS_ROOT = resolve(import.meta.dirname, '../../../../../RippleViewTests');

const ALL_REAL_CONTRACTS = [
  'libraries/core-controls/rv-button/contract.yaml',
  'libraries/core-controls/rv-input/contract.yaml',
  'libraries/core-controls/rv-multi-select/contract.yaml',
  'libraries/core-controls/rv-form/contract.yaml',
  'libraries/data-grid/ng15/contract.yaml',
  'libraries/data-grid/ng17/contract.yaml',
  'libraries/react-core-controls/rv-button/contract.yaml',
  'libraries/react-core-controls/rv-input/contract.yaml',
  'libraries/react-core-controls/rv-multi-select/contract.yaml',
  'libraries/react-core-controls/rv-form/contract.yaml',
].map((relative) => resolve(RippleView_TESTS_ROOT, relative));

const describeIfPresent = existsSync(ALL_REAL_CONTRACTS[0] as string) ? describe : describe.skip;

describeIfPresent(
  'contract — integration against the real RippleViewTests contract.yaml files ( DoD)',
  () => {
    it('AC-1: every real contract.yaml in RippleViewTests loads and validates against ContractSchema', () => {
      for (const file of ALL_REAL_CONTRACTS) {
        expect(() => loadContract(file)).not.toThrow();
      }
    });

    it("AC-1: core-controls' rv-multi-select contract is grounded in the real PrimeNG-rendered roles", () => {
      const contract = loadContract(
        resolve(RippleView_TESTS_ROOT, 'libraries/core-controls/rv-multi-select/contract.yaml'),
      );

      expect(contract.component.name).toBe('rv-multi-select');
      expect(contract.component.package).toBe('@enterprise/core-controls');
      const anchorIds = contract.anchors.map((anchor) => anchor.id);
      expect(anchorIds).toContain('trigger');
      expect(anchorIds).toContain('panel');
      expect(anchorIds).toContain('option');
      // The state proving 's real, shipped regression is in scope.
      expect(contract.states.map((s) => s.id)).toContain('multiSelectValueEmitted');
    });

    it("AC-1: react-core-controls' rv-multi-select is a SEPARATE contract from the Angular one, not a duplicate", () => {
      const angular = loadContract(
        resolve(RippleView_TESTS_ROOT, 'libraries/core-controls/rv-multi-select/contract.yaml'),
      );
      const react = loadContract(
        resolve(RippleView_TESTS_ROOT, 'libraries/react-core-controls/rv-multi-select/contract.yaml'),
      );
      expect(angular.component.package).toBe('@enterprise/core-controls');
      expect(react.component.package).toBe('@enterprise/react-core-controls');
      // Same conceptual component, same real PrimeReact-confirmed role set —
      // but two independent files, never the same package.
      expect(angular.component.package).not.toBe(react.component.package);
    });

    it('AC-1: data-grid splits per generation — ng15/ng17 genuinely render a different top-level role (verified, not assumed)', () => {
      const ng15 = loadContract(resolve(RippleView_TESTS_ROOT, 'libraries/data-grid/ng15/contract.yaml'));
      const ng17 = loadContract(resolve(RippleView_TESTS_ROOT, 'libraries/data-grid/ng17/contract.yaml'));

      expect(ng15.component.package).toBe('@enterprise/data-grid');
      expect(ng17.component.package).toBe('@enterprise/data-grid');

      // AG Grid 27 (ng15) renders role="grid"; AG Grid 30 (ng17) renders
      // role="treegrid" — confirmed via a real Playwright capture against
      // both live playgrounds, not assumed from the vendored bundle alone.
      expect(ng15.anchors.find((a) => a.id === 'grid')?.role).toBe('grid');
      expect(ng17.anchors.find((a) => a.id === 'grid')?.role).toBe('treegrid');

      // Everything else about the wrapper renders identically across the
      // generation split — both still declare the same functional anchors.
      for (const contract of [ng15, ng17]) {
        const anchorIds = contract.anchors.map((a) => a.id);
        expect(anchorIds).toEqual(expect.arrayContaining(['columnHeader', 'row', 'cell']));
        // Selection is real AG Grid capability, honestly marked optional —
        // not exercised by any current rippleview-examples consumer app.
        expect(contract.anchors.find((a) => a.id === 'rowCheckbox')?.required).toBe(false);
      }
    });

    it('AC-2: findMissingRequiredAnchors flags a required anchor absent from a real present-id scan result', () => {
      const contract = loadContract(
        resolve(RippleView_TESTS_ROOT, 'libraries/core-controls/rv-multi-select/contract.yaml'),
      );

      // Simulate a scan that found the panel but NOT the trigger — trigger
      // is declared required: true.
      const missing = findMissingRequiredAnchors(contract, ['panel', 'option']);

      expect(missing).toContain('trigger');
      expect(missing).not.toContain('panel');
    });

    it('AC-2: reports no missing anchors when every required anchor is present', () => {
      for (const file of ALL_REAL_CONTRACTS) {
        const contract = loadContract(file);
        const requiredIds = contract.anchors.filter((anchor) => anchor.required).map((a) => a.id);
        expect(findMissingRequiredAnchors(contract, requiredIds)).toEqual([]);
      }
    });
  },
);
