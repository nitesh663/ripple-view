import type { Contract } from './schema.js';

// ── Required-anchor presence check (AC-2) ───────────────────────────────────
//  scopes this story to the contract's declared surface, not a full
// a11y/structure scanner (that's Module 1 /, not started). This is a
// pure diff: given the contract's declared anchors and a set of anchor ids
// actually observed on the rendered component (from a future a11y/structure
// scan), it reports which REQUIRED anchors are missing. The real scan that
// produces `presentAnchorIds` is out of scope here.

/**
 * Return the ids of every `required: true` anchor in `contract` that is NOT
 * present in `presentAnchorIds`. Optional anchors are never flagged.
 */
export function findMissingRequiredAnchors(
  contract: Contract,
  presentAnchorIds: ReadonlySet<string> | readonly string[],
): string[] {
  const present = presentAnchorIds instanceof Set ? presentAnchorIds : new Set(presentAnchorIds);
  return contract.anchors
    .filter((anchor) => anchor.required && !present.has(anchor.id))
    .map((anchor) => anchor.id);
}
