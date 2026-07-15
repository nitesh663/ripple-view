import { readFileSync } from 'node:fs';
import { parse as parseYaml } from 'yaml';
import { z } from 'zod';

// ── Access-points config (T-8.4.1) ─────────────────────────────────
// Maps a component (identified the same way RippleViewTests' own folder layout
// does — "<package>/<component>", or just "<package>" for a single-component
// package) to a URL/route where it's rendered in an ALREADY-RUNNING
// playground app. This story deliberately does not build/serve the app
// itself (see 's scope note) — reachability is checked at capture
// time by @rippleview/plugin-playwright, not here.
//
// `selectNav` (optional): the real rippleview-examples playground apps (both the
// Angular ng17 and React r19 ones — confirmed by reading both apps' actual
// source) are a single-page demo that switches sections via an in-page nav
// button click, not real routes — there is no URL that deep-links straight
// to e.g. the multi-select demo. `selectNav` names the accessible button
// label to click after navigating to `url`, before capturing the snapshot
// (e.g. "Multi Select"). Omit it for a playground that already lands on the
// right section by default.

export const AccessPointSchema = z.object({
  /** e.g. "core-controls/rv-multi-select", or "data-grid" for a single-component package. */
  component: z.string(),
  /** A real, already-serving URL — e.g. http://localhost:4200/. */
  url: z.string(),
  /** Accessible name of an in-page nav button to click before capturing, if the playground needs one. */
  selectNav: z.string().optional(),
});

export const AccessPointsConfigSchema = z.object({
  accessPoints: z.array(AccessPointSchema).default([]),
});

export type AccessPoint = z.infer<typeof AccessPointSchema>;
export type AccessPointsConfig = z.infer<typeof AccessPointsConfigSchema>;

export type AccessPointsErrorCode = 'ACCESS_POINTS_SCHEMA_ERROR';

export class AccessPointsError extends Error {
  readonly code: AccessPointsErrorCode;

  constructor(code: AccessPointsErrorCode, message: string) {
    super(message);
    this.name = 'AccessPointsError';
    this.code = code;
  }
}

export function parseAccessPointsConfig(yaml: string): AccessPointsConfig {
  const raw: unknown = parseYaml(yaml);
  const result = AccessPointsConfigSchema.safeParse(raw);
  if (!result.success) {
    throw new AccessPointsError(
      'ACCESS_POINTS_SCHEMA_ERROR',
      `Access-points config is invalid: ${result.error.issues.map((i) => `[${i.path.join('.')}] ${i.message}`).join('; ')}`,
    );
  }
  return result.data;
}

export function loadAccessPointsConfig(filePath: string): AccessPointsConfig {
  const content = readFileSync(filePath, 'utf8');
  return parseAccessPointsConfig(content);
}

/** Find the configured access point for `component`, or undefined if none is configured. */
export function findAccessPoint(
  config: AccessPointsConfig,
  component: string,
): AccessPoint | undefined {
  return config.accessPoints.find((entry) => entry.component === component);
}
