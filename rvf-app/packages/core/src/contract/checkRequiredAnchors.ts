import type { Contract, ContractAnchor } from './schema.js';
import { namePatternToMatcher } from './anchorMatching.js';

// ── Real-time required-anchor check (T-8.5.1) ─────────────────────
// Wires 's findMissingRequiredAnchors-style diff together with
// 's real capture diagnostics (testIdOnly, orphanLabels) into ONE
// finding per required anchor, carrying a concrete, actionable hypothesis
// when missing — never a generic "anchor missing" message, and never a
// fabricated cause this function can't actually support from the evidence
// it has.
//
// G1: takes plain `{ role, name }[]` + plain diagnostic arrays, exactly
// mergeAnchors.ts's convention — never depends on @rippleview/plugin-playwright.

export interface CheckedNode {
  role: string;
  name: string;
}

export interface AnchorCheckDiagnostics {
  /** BDD-03 fallback signal — data-testid found on an unnamed element (see CaptureResult.testIdOnly). */
  testIdOnly?: readonly string[];
  /** A <label> rendered but not linked to any control (see CaptureResult.orphanLabels). */
  orphanLabels?: readonly string[];
}

export interface AnchorFinding {
  anchorId: string;
  role: string;
  namePattern: string;
  status: 'present' | 'missing';
  /** Only set when status is 'missing' — a concrete, evidence-backed hypothesis, or a clearly-scoped "couldn't determine a specific cause" message. */
  hypothesis?: string;
}

export interface CheckRequiredAnchorsResult {
  passed: boolean;
  /** One entry per REQUIRED anchor in the contract (optional anchors are never checked). */
  findings: AnchorFinding[];
}

/**
 * Checks every `required: true` anchor in `contract` against `captured`
 * (the real nodes found this run). Optional anchors are never checked —
 * this function only ever reports on what the contract actually requires.
 * Never throws (G10: findings are data) — an empty `captured` list simply
 * means every required anchor is reported missing, each with whatever
 * hypothesis the diagnostics support.
 */
export function checkRequiredAnchors(
  contract: Contract,
  captured: readonly CheckedNode[],
  diagnostics: AnchorCheckDiagnostics = {},
): CheckRequiredAnchorsResult {
  const requiredAnchors = contract.anchors.filter((anchor) => anchor.required);
  const findings = requiredAnchors.map((anchor) => checkOneAnchor(anchor, captured, diagnostics));

  return {
    passed: findings.every((finding) => finding.status === 'present'),
    findings,
  };
}

function checkOneAnchor(
  anchor: ContractAnchor,
  captured: readonly CheckedNode[],
  diagnostics: AnchorCheckDiagnostics,
): AnchorFinding {
  const matches = namePatternToMatcher(anchor.role, anchor.name);
  const found = captured.some((node) => matches(node.role, node.name));

  if (found) {
    return { anchorId: anchor.id, role: anchor.role, namePattern: anchor.name, status: 'present' };
  }

  return {
    anchorId: anchor.id,
    role: anchor.role,
    namePattern: anchor.name,
    status: 'missing',
    hypothesis: buildHypothesis(anchor, diagnostics),
  };
}

/**
 * Degrades through three tiers of specificity, never claiming more
 * confidence than the evidence supports:
 *   1. An orphan label exists -> the single most common real cause (a
 *      label rendered but never linked via for/aria-labelledby/wrapping).
 *   2. No orphan label, but a data-testid exists -> the BDD-03 fallback is
 *      present, real accessibility is not.
 *   3. Neither signal -> honestly say so, and suggest checking reachability
 *      (wrong section/route) rather than inventing an accessibility cause.
 */
function buildHypothesis(anchor: ContractAnchor, diagnostics: AnchorCheckDiagnostics): string {
  const orphanLabels = diagnostics.orphanLabels ?? [];
  const testIdOnly = diagnostics.testIdOnly ?? [];

  if (orphanLabels.length > 0) {
    return (
      `Found unlinked <label> text ${JSON.stringify(orphanLabels)} in the captured scope. ` +
      `The most likely cause: a <label> exists but is not linked to the "${anchor.id}" control via ` +
      `for/aria-labelledby (or by wrapping it directly) — so the control has no accessible name at all. ` +
      `Fix: link the label to the control in the component's template, republish the library at a new ` +
      `version, then re-run this check.`
    );
  }

  if (testIdOnly.length > 0) {
    return (
      `No real accessible role/name was found, but data-testid attribute(s) exist (${JSON.stringify(testIdOnly)}). ` +
      `A data-testid is never sufficient on its own (G2) — implement a real ARIA role + accessible name ` +
      `on the "${anchor.id}" control, republish, then re-run this check.`
    );
  }

  return (
    `No real accessible role/name AND no orphan-label or data-testid signal was found for "${anchor.id}" ` +
    `(expected role="${anchor.role}", name matching "${anchor.name}"). This check can't ` +
    `determine a specific cause from the evidence gathered — verify the access point actually reaches the ` +
    `section/state where "${anchor.id}" should render (wrong selectNav/route, or a precondition not met) ` +
    `before assuming an accessibility defect.`
  );
}
