// VersionResolutionError.ts — (US-8.2), T-8.2.3.
//
// Raised at the CLI/gate boundary (never inside the pure
// resolveBaseTestVersion itself — that function returns `null`, G10) when a
// caller that NEEDS a resolved version (e.g. resolveImport, wiring an
// `imports:` entry to an actual `@RippleViewTests/<lib>` version) gets `null`
// back. Mirrors ParseError's shape/style (packages/core/src/bdd/ParseError.ts)
// for consistency across this codebase's "typed domain error" convention.

export type VersionResolutionErrorCode = 'NO_QUALIFYING_BASE_TEST_VERSION';

export class VersionResolutionError extends Error {
  readonly code: VersionResolutionErrorCode;
  readonly lib: string;
  readonly requestedVersion: string;

  constructor(opts: { code: VersionResolutionErrorCode; lib: string; requestedVersion: string }) {
    super(
      `No published base-test version of "${opts.lib}" qualifies for requested version "${opts.requestedVersion}" (every published version is greater than requested)`,
    );
    this.name = 'VersionResolutionError';
    this.code = opts.code;
    this.lib = opts.lib;
    this.requestedVersion = opts.requestedVersion;
  }
}
