import {
  loadAccessPointsConfig,
  findAccessPoint,
  loadContract,
  checkRequiredAnchors,
} from '@rippleview/core';
import {
  captureAccessibilityTree,
  UnreachablePlaygroundError,
  NavTargetNotFoundError,
} from '@rippleview/plugin-playwright';
import type { CaptureResult } from '@rippleview/plugin-playwright';
import type { AnchorFinding } from '@rippleview/core';

// ── checkAnchorsCommand () ───────────────────────────────────────────
// Wires 's findMissingRequiredAnchors-equivalent diff (checkRequiredAnchors)
// together with 's real captureAccessibilityTree — the two pieces
// existed separately; this is the first command that actually runs them
// back-to-back against a real component, producing a detailed, actionable
// finding instead of a boolean. Reuses the SAME access-points.yaml config
//  established — no new capture mechanism.

export interface CheckAnchorsOptions {
  /** Path to access-points.yaml. */
  accessPoints: string;
  /** e.g. "core-controls/rv-multi-select" — must be configured in access-points.yaml. */
  component: string;
  /** Path to the component's contract.yaml. */
  contract: string;
  /** Injectable capture function — defaults to the real Playwright capture. */
  capture?: (url: string, selectNav?: string) => Promise<CaptureResult>;
}

export interface CheckAnchorsResult {
  exitCode: number;
  findings?: AnchorFinding[];
}

/**
 * Capture the real accessibility tree at the access point configured for
 * `component`, then check every `required: true` anchor in its contract.yaml
 * against what was actually found. Never throws — every failure path
 * (missing/invalid config, unconfigured component, unreachable playground,
 * nav target not found) is caught and reported with a clear stderr message,
 * returning `{ exitCode: 1 }` (G7/G10). A real missing-anchor finding is
 * NOT an exception either — it's the expected, reported outcome of a real
 * check, also `{ exitCode: 1 }`, but with `findings` populated so the
 * caller can see exactly what's wrong and why.
 */
export async function checkAnchorsCommand(opts: CheckAnchorsOptions): Promise<CheckAnchorsResult> {
  const capture = opts.capture ?? captureAccessibilityTree;

  let accessPoint;
  try {
    const config = loadAccessPointsConfig(opts.accessPoints);
    accessPoint = findAccessPoint(config, opts.component);
  } catch (err) {
    process.stderr.write(
      `rv contract check-anchors: failed to load access-points config "${opts.accessPoints}" — ${describeError(err)}\n`,
    );
    return { exitCode: 1 };
  }

  if (accessPoint === undefined) {
    process.stderr.write(
      `rv contract check-anchors: no access point configured for component "${opts.component}" in "${opts.accessPoints}".\n`,
    );
    return { exitCode: 1 };
  }

  let contract;
  try {
    contract = loadContract(opts.contract);
  } catch (err) {
    process.stderr.write(
      `rv contract check-anchors: failed to load contract "${opts.contract}" — ${describeError(err)}\n`,
    );
    return { exitCode: 1 };
  }

  let captureResult: CaptureResult;
  try {
    captureResult = await capture(accessPoint.url, accessPoint.selectNav);
  } catch (err) {
    if (err instanceof UnreachablePlaygroundError || err instanceof NavTargetNotFoundError) {
      process.stderr.write(`rv contract check-anchors: ${err.message}\n`);
    } else {
      process.stderr.write(`rv contract check-anchors: capture failed — ${describeError(err)}\n`);
    }
    return { exitCode: 1 };
  }

  const result = checkRequiredAnchors(contract, captureResult.named, {
    testIdOnly: captureResult.testIdOnly,
    orphanLabels: captureResult.orphanLabels,
  });

  for (const finding of result.findings) {
    if (finding.status === 'present') {
      process.stdout.write(
        `PASS  ${finding.anchorId} (${finding.role} "${finding.namePattern}")\n`,
      );
    } else {
      process.stderr.write(
        `FAIL  ${finding.anchorId} (${finding.role} "${finding.namePattern}") — MISSING\n  ${finding.hypothesis}\n`,
      );
    }
  }

  return { exitCode: result.passed ? 0 : 1, findings: result.findings };
}

function describeError(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
