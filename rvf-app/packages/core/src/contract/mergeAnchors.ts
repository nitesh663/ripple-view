import type { Contract, ContractAnchor } from './schema.js';
import { namePatternToMatcher } from './anchorMatching.js';

// ── Anchor merging (T-8.4.3) ───────────────────────────────────────
// Merges a set of captured (role, name) pairs into an existing Contract's
// `anchors` array — and ONLY that array. Every other field (description,
// states, api, data, probes, a11y) passes through completely untouched
// (AC-2): this is intentionally not a full contract regenerator.
//
// G1: this takes a plain `{ role, name }[]` shape, not @rippleview/plugin-playwright's
// AccessibilityNode type — @rippleview/core never depends on a browser-engine
// package, even transitively.

export interface CapturedNode {
  role: string;
  name: string;
}

export interface MergeAnchorsResult {
  contract: Contract;
  /** Anchors that didn't match any existing anchor and were newly proposed. */
  added: ContractAnchor[];
}

/**
 * For each captured node, if no existing anchor already covers its
 * role+name (matching `anchor.name`'s glob pattern, e.g. "Sort *"), propose
 * a new anchor. New anchors are always `required: false` — a real a11y/
 * structure decision about what's REQUIRED is a human judgment call this
 * function never makes on its own (G10: this is a proposal, not a verdict).
 *
 * Never throws; an empty `captured` list returns the contract unchanged.
 */
export function mergeAnchors(
  contract: Contract,
  captured: readonly CapturedNode[],
): MergeAnchorsResult {
  const added: ContractAnchor[] = [];
  const existingMatchers = contract.anchors.map((anchor) => ({
    anchor,
    matches: namePatternToMatcher(anchor.role, anchor.name),
  }));

  for (const node of captured) {
    const alreadyCovered = existingMatchers.some(({ matches }) => matches(node.role, node.name));
    const alreadyProposed = added.some((a) => a.role === node.role && a.name === node.name);
    if (alreadyCovered || alreadyProposed) {
      continue;
    }
    added.push({
      id: proposeAnchorId(node.role, node.name),
      role: node.role,
      name: node.name,
      required: false,
      description: `Auto-captured from a running playground () — review and confirm required/description by hand.`,
    });
  }

  if (added.length === 0) {
    return { contract, added: [] };
  }

  return {
    contract: { ...contract, anchors: [...contract.anchors, ...added] },
    added,
  };
}

function proposeAnchorId(role: string, name: string): string {
  const slug = name
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((word, i) => (i === 0 ? word : word[0]?.toUpperCase() + word.slice(1)))
    .join('');
  return slug.length > 0 ? `${role}${capitalize(slug)}` : role;
}

function capitalize(value: string): string {
  return value.length === 0 ? value : (value[0]?.toUpperCase() ?? '') + value.slice(1);
}
