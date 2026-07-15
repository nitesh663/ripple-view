// createBundle.ts — AC-1 packer: builds a content-addressed (sha256) archive
// of a consumer app, excluding node_modules/.git/dist and scrubbing secret
// files entirely (G18). All I/O (walking, reading, zipping, the clock) is
// injected so this function is pure/deterministic and testable (G13) —
// production wiring lives in createBundleStore.ts.

import { createHash } from 'node:crypto';
import { shouldExcludePath, shouldScrubFile } from './scrub.js';
import type { BundleManifest } from './types.js';

export interface WalkEntry {
  relPath: string;
  absPath: string;
  isDirectory: boolean;
}

/** Minimal zip-writer contract — implementations wrap a real zip library. */
export interface ZipWriter {
  addFile(relPath: string, data: Buffer): void;
  toBuffer(): Buffer;
}

export interface CreateBundleOptions {
  appName: string;
  appDir: string;
  /** Injected — lists all files/dirs under appDir (relative + absolute paths). */
  walk: (appDir: string) => WalkEntry[];
  /** Injected — reads a file's bytes. */
  readFile: (absPath: string) => Buffer;
  /** Injected — constructs a fresh ZipWriter for this archive. */
  zipFactory: () => ZipWriter;
  /** Injected clock; defaults to new Date().toISOString(). */
  now?: () => string;
}

export interface BundleResult {
  manifest: BundleManifest;
  archive: Buffer;
}

/**
 * Walks `appDir`, skips excluded directories and secret files entirely, and
 * adds everything else to the zip. `rippleview.config.yaml` and any lockfile are
 * not in the exclude list, so they pass through naturally — no special-case
 * code is required to "always include" them.
 */
export function createBundle(opts: CreateBundleOptions): BundleResult {
  const now = opts.now ?? (() => new Date().toISOString());
  const zip = opts.zipFactory();

  const entries = opts.walk(opts.appDir);
  for (const entry of entries) {
    if (entry.isDirectory) {
      continue;
    }
    if (shouldExcludePath(entry.relPath)) {
      continue;
    }
    if (shouldScrubFile(entry.relPath)) {
      continue;
    }
    zip.addFile(entry.relPath, opts.readFile(entry.absPath));
  }

  const archive = zip.toBuffer();
  const digest = createHash('sha256').update(archive).digest('hex');

  return {
    manifest: {
      appName: opts.appName,
      digest,
      createdAt: now(),
      sizeBytes: archive.length,
    },
    archive,
  };
}
