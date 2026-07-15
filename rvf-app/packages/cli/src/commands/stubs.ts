// ── StubResult ────────────────────────────────────────────────────────────────

export interface StubResult {
  exitCode: number;
  message: string;
}

// ── stubCommand ───────────────────────────────────────────────────────────────

/**
 * Return a stub result for a command that has not yet been implemented.
 * The `exitCode` is always 1 so CI fails loudly rather than silently passing.
 */
export function stubCommand(name: string): StubResult {
  return { exitCode: 1, message: `${name}: not yet implemented` };
}
