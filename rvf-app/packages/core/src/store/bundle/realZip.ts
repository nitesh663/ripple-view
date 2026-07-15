// realZip.ts — production fs-walker, file-reader, and adm-zip-backed
// ZipWriter for createBundle. Kept separate from createBundle.ts so that
// file's logic stays pure/injectable (G13) while real I/O wiring lives here,
// one level removed, exactly mirroring how createBundleStore.ts wires real
// fs/zip for the BundleStore implementations.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import AdmZip from 'adm-zip';
import type { WalkEntry, ZipWriter } from './createBundle.js';
import { shouldExcludePath } from './scrub.js';

/**
 * Recursively lists every file/dir under `appDir` with paths relative to it.
 *
 * Excluded directories (node_modules/.git/dist) are never descended into —
 * createBundle's post-walk filtering alone would still produce a correct
 * archive, but real consumer apps' node_modules can be enormous and
 * pnpm-style installs are symlink-heavy, so skipping the recursion entirely
 * keeps this fast and avoids walking into the package-manager store.
 */
export function realWalk(appDir: string): WalkEntry[] {
  const entries: WalkEntry[] = [];
  walkInto(appDir, appDir, entries);
  return entries;
}

function walkInto(root: string, dir: string, out: WalkEntry[]): void {
  for (const name of readdirSync(dir, { encoding: 'utf8' })) {
    const absPath = join(dir, name);
    const relPath = relative(root, absPath);
    const isDirectory = statSync(absPath).isDirectory();
    out.push({ relPath, absPath, isDirectory });
    if (isDirectory && !shouldExcludePath(relPath)) {
      walkInto(root, absPath, out);
    }
  }
}

/** Reads a file's bytes from disk. */
export function realReadFile(absPath: string): Buffer {
  return readFileSync(absPath);
}

/** Constructs a fresh adm-zip-backed ZipWriter. */
export function realZipFactory(): ZipWriter {
  const zip = new AdmZip();
  return {
    addFile: (relPath, data) => {
      zip.addFile(relPath, data);
    },
    toBuffer: () => zip.toBuffer(),
  };
}
