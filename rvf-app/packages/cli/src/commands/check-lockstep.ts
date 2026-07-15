import {
  checkLockstepPublish,
  createRegistryVersionsFetcher,
  type PublishedVersionsFetcher,
} from '@rippleview/core';

// ── checkLockstepCommand () ──────────────────────────────────────────
// The "release-pipeline hook (example)" T-8.3.1 asks for — a release script/
// CI step runs this against the version about to be published, BEFORE the
// publish completes, and blocks on a non-zero exit.

export interface CheckLockstepOptions {
  /** The base-test package name to check, e.g. "@RippleViewTests/core-controls". */
  packageName: string;
  /** The component version about to be released, e.g. "17.2.0" or "18.3.3-beta.1". */
  version: string;
  /** Registry base URL, e.g. http://localhost:4873. */
  registry: string;
  /** Injectable fetcher — defaults to the real registry HTTP fetcher. */
  fetchPublishedVersions?: PublishedVersionsFetcher;
}

export interface CheckLockstepResult {
  exitCode: number;
  passed?: boolean;
  resolvedBaseTestVersion?: string | null;
}

/**
 * Fetches the real published `@RippleViewTests/<lib>` versions and checks
 * lockstep for the version about to be released. Never throws — a registry
 * fetch failure is reported with a clear message and `{ exitCode: 1 }`
 * (G7/G10); a real lockstep failure (the check itself returning
 * `passed: false`) is ALSO `{ exitCode: 1 }`, with the explanatory message
 * printed so a release pipeline's log shows exactly why it was blocked.
 */
export async function checkLockstepCommand(
  opts: CheckLockstepOptions,
): Promise<CheckLockstepResult> {
  const fetchPublishedVersions =
    opts.fetchPublishedVersions ?? createRegistryVersionsFetcher(opts.registry);

  let published: string[];
  try {
    published = await fetchPublishedVersions(opts.packageName);
  } catch (err) {
    process.stderr.write(
      `rv tests check-lockstep: failed to fetch published versions of "${opts.packageName}" — ${describeError(err)}\n`,
    );
    return { exitCode: 1 };
  }

  const result = checkLockstepPublish(opts.version, published);

  if (result.passed) {
    process.stdout.write(`${result.message}\n`);
  } else {
    process.stderr.write(`${result.message}\n`);
  }

  return {
    exitCode: result.passed ? 0 : 1,
    passed: result.passed,
    resolvedBaseTestVersion: result.resolvedBaseTestVersion,
  };
}

function describeError(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
