import {
  loadAccessPointsConfig,
  findAccessPoint,
  writeAnchorsIntoContractFile,
  type CapturedNode,
} from '@rippleview/core';
import {
  captureAccessibilityTree,
  UnreachablePlaygroundError,
  NavTargetNotFoundError,
  type CaptureResult,
} from '@rippleview/plugin-playwright';

// ── generateAnchorsCommand () ────────────────────────────────────────

export interface GenerateAnchorsOptions {
  /** Path to access-points.yaml. */
  accessPoints: string;
  /** e.g. "core-controls/rv-multi-select" — must be configured in access-points.yaml. */
  component: string;
  /** Path to the component's contract.yaml — updated in place, or scaffolded if absent. */
  contract: string;
  /** Real package + component name to scaffold with, if contract.yaml doesn't exist yet. */
  package: string;
  /** Injectable capture function — defaults to the real Playwright capture. */
  capture?: (url: string, selectNav?: string) => Promise<CaptureResult>;
}

export interface GenerateAnchorsResult {
  exitCode: number;
  added?: string[];
}

/**
 * Capture the real accessibility tree at the access point configured for
 * `component`, then merge any newly-found roles into its contract.yaml.
 * Never throws — every failure path (missing/invalid access-points config,
 * unconfigured component, unreachable playground, AND finding nothing
 * usable at all — AC-3) is caught/handled and reported with a clear stderr
 * message, returning `{ exitCode: 1 }` (G7/G10). This is meant to be safe
 * to run in a loop over many components: one bad component never throws,
 * so a calling script's loop reaches the next component regardless.
 */
export async function generateAnchorsCommand(
  opts: GenerateAnchorsOptions,
): Promise<GenerateAnchorsResult> {
  const capture = opts.capture ?? captureAccessibilityTree;

  let accessPoint;
  try {
    const config = loadAccessPointsConfig(opts.accessPoints);
    accessPoint = findAccessPoint(config, opts.component);
  } catch (err) {
    process.stderr.write(
      `rv contract generate-anchors: failed to load access-points config "${opts.accessPoints}" — ${describeError(err)}\n`,
    );
    return { exitCode: 1 };
  }

  if (accessPoint === undefined) {
    process.stderr.write(
      `rv contract generate-anchors: no access point configured for component "${opts.component}" in "${opts.accessPoints}".\n`,
    );
    return { exitCode: 1 };
  }

  let captureResult: CaptureResult;
  try {
    captureResult = await capture(accessPoint.url, accessPoint.selectNav);
  } catch (err) {
    if (err instanceof UnreachablePlaygroundError || err instanceof NavTargetNotFoundError) {
      process.stderr.write(`rv contract generate-anchors: ${err.message}\n`);
    } else {
      process.stderr.write(
        `rv contract generate-anchors: capture failed — ${describeError(err)}\n`,
      );
    }
    return { exitCode: 1 };
  }

  if (captureResult.named.length === 0) {
    if (captureResult.testIdOnly.length > 0) {
      process.stderr.write(
        `rv contract generate-anchors: "${opts.component}" has no real accessible role/name at ` +
          `"${accessPoint.url}" — found data-testid only (${captureResult.testIdOnly.join(', ')}). ` +
          `Per G2 (A11y-tree only), a data-testid is never written as a contract anchor — add a real ` +
          `ARIA role + accessible name to this component first, then re-run.\n`,
      );
    } else {
      process.stderr.write(
        `rv contract generate-anchors: "${opts.component}" has nothing capturable at "${accessPoint.url}" — ` +
          `no real accessible role/name AND no data-testid found at all. Implement basic accessibility ` +
          `(or at least a data-testid as a stopgap) on this component before this tool can do anything here.\n`,
      );
    }
    return { exitCode: 1 };
  }

  const captured: CapturedNode[] = captureResult.named;

  try {
    const [componentName, ...rest] = opts.component.split('/');
    const result = writeAnchorsIntoContractFile(opts.contract, captured, {
      name:
        rest.length > 0
          ? (rest.at(-1) ?? componentName ?? opts.component)
          : (componentName ?? opts.component),
      package: opts.package,
    });
    return { exitCode: 0, added: result.added.map((a) => a.id) };
  } catch (err) {
    process.stderr.write(
      `rv contract generate-anchors: failed to write "${opts.contract}" — ${describeError(err)}\n`,
    );
    return { exitCode: 1 };
  }
}

function describeError(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
