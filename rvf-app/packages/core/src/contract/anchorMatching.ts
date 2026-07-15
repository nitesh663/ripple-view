// ── Shared anchor name-pattern matching ─────────────────────────────────────
// Used by both mergeAnchors.ts () and checkRequiredAnchors.ts
// () — factored out so the glob semantics ("Sort *" style patterns,
// RippleView_SPECS) stay identical wherever a captured (role, name) pair is
// checked against a contract anchor's declared role/name.

/** Turns an anchor's declared `role`/`name` (name may be a "Sort *"-style glob) into a real-node matcher. */
export function namePatternToMatcher(
  role: string,
  namePattern: string,
): (role: string, name: string) => boolean {
  if (namePattern === '*') {
    return (nodeRole) => nodeRole === role;
  }
  const escaped = namePattern.replaceAll(/[.+?^${}()|[\]\\]/g, '\\$&').replaceAll('*', '.*');
  const regex = new RegExp(`^${escaped}$`);
  return (nodeRole, nodeName) => nodeRole === role && regex.test(nodeName);
}
