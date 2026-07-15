import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { Document, parseDocument } from 'yaml';
import { parseContract } from './loader.js';
import { mergeAnchors, type CapturedNode, type MergeAnchorsResult } from './mergeAnchors.js';
import type { Contract } from './schema.js';

// ── Format-preserving contract.yaml write-back (T-8.4.3) ──────────
// mergeAnchors() operates on a parsed, plain Contract object — fine for
// deciding WHAT to add, but re-serializing a plain object with
// YAML.stringify() would destroy every hand-written comment in the file
// (confirmed: 's contracts carry real, load-bearing comments
// documenting e.g. the  regression — losing them is not acceptable,
// AC-2's "without destroying hand-authored fields" extends to comments,
// not just data fields). This uses `yaml`'s Document API instead, which
// mutates only the `anchors` sequence and re-serializes everything else
// byte-for-byte (verified directly against a real contract.yaml; the only
// cosmetic residue is flow-array bracket spacing, e.g. "[combobox]" ->
// "[ combobox ]" — harmless, still valid YAML, unrelated to the actual
// added content).

export interface WriteAnchorsResult extends MergeAnchorsResult {
  /** Whether a new contract.yaml was scaffolded (true) or an existing one was updated (false). */
  scaffolded: boolean;
}

/**
 * Read `filePath` (or scaffold a minimal new contract if it doesn't exist
 * yet — T-8.4.3), merge `captured` nodes into its `anchors`, and write the
 * result back preserving every other line/comment. Never throws on a
 * missing file (that's the scaffold path); still throws ContractError on a
 * genuinely malformed existing file, same as `loadContract`.
 */
export function writeAnchorsIntoContractFile(
  filePath: string,
  captured: readonly CapturedNode[],
  componentDefaults: { name: string; package: string },
): WriteAnchorsResult {
  if (!existsSync(filePath)) {
    const scaffolded = scaffoldContract(componentDefaults);
    const merged = mergeAnchors(scaffolded, captured);
    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, stringifyContract(merged.contract), 'utf8');
    return { ...merged, scaffolded: true };
  }

  const rawYaml = readFileSync(filePath, 'utf8');
  const contract = parseContract(rawYaml);
  const merged = mergeAnchors(contract, captured);

  if (merged.added.length === 0) {
    return { ...merged, scaffolded: false };
  }

  const doc = parseDocument(rawYaml);
  for (const anchor of merged.added) {
    doc.addIn(['anchors'], doc.createNode(anchor));
  }
  writeFileSync(filePath, doc.toString({ lineWidth: 0 }), 'utf8');

  return { ...merged, scaffolded: false };
}

function scaffoldContract(componentDefaults: { name: string; package: string }): Contract {
  return {
    component: {
      name: componentDefaults.name,
      package: componentDefaults.package,
      primaryRole: '',
      description: 'Auto-scaffolded by — fill in a real description by hand.',
    },
    anchors: [],
    states: [],
    api: { inputs: [], outputs: [], slots: [] },
    data: { shape: {}, example: {} },
    probes: [],
    a11y: { requiredRoles: [], requiredLabels: [], wcagLevel: 'AA' },
  };
}

function stringifyContract(contract: Contract): string {
  return new Document(contract).toString({ lineWidth: 0 });
}
