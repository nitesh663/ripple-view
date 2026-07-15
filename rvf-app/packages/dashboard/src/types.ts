// ── Dashboard Fleet API types ──────────────────────────────────────────────────
// These are the response shapes for the read-only Fleet view (US-12.2).
// They live here, not in @rippleview/core, to keep core UI-agnostic (G1).

export interface DriftInfo {
  /** 'none' means the app does not consume this library in this channel. */
  badge: 'current' | 'minor' | 'major' | 'none';
  majorsBehind: number;
  minorsBehind: number;
  patchesBehind: number;
}

export interface FleetCell {
  library: string;
  /** null when this app does not declare this library in its package.json. */
  consumed: string | null;
  latest: string;
  drift: DriftInfo;
}

export interface FleetAppRow {
  appName: string;
  department: string;
  /** One cell per library — same order as FleetChannel.libraries. */
  cells: FleetCell[];
}

export interface FleetChannel {
  framework: string; // e.g. "angular", "react"
  generation: string; // e.g. "17", "15"
  label: string; // e.g. "Angular ng17"
  /** Sorted list of tracked library names in this channel. */
  libraries: string[];
  /** Latest published version per library. Populated from library registrations. */
  latestVersions: Record<string, string>;
  apps: FleetAppRow[];
}

export interface FleetResponse {
  channels: FleetChannel[];
}
