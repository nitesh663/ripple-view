import { mkdtempSync, mkdirSync, readdirSync, statSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Directory names excluded by exact path-segment match (not substring).
// Duplicated from packages/core/src/store/bundle/scrub.ts's
// DEFAULT_EXCLUDE_DIRS rather than imported: root-adjacent CLI commands stay
// decoupled from @rippleview/core's internal bundling concern (G19-style boundary
// hygiene — this is a copy for the version-swap workspace, not a bundle).
const EXCLUDED_DIR_NAMES = ['node_modules', '.git', 'dist'];

/**
 * Recursively copies `srcDir` into a fresh `rv-gate-*` temp directory,
 * skipping any path segment in EXCLUDED_DIR_NAMES, so the version-swap step
 * (T-5.3.2) never mutates the user's real working tree.
 *
 * @param srcDir - the consumer app directory to copy
 * @returns the absolute path to the new temp copy
 */
export function copyAppToTmp(srcDir: string): string {
  const destRoot = mkdtempSync(join(tmpdir(), 'rv-gate-'));
  const destDir = join(destRoot, 'app');
  mkdirSync(destDir, { recursive: true });
  copyDirRecursive(srcDir, destDir);
  return destDir;
}

function copyDirRecursive(srcDir: string, destDir: string): void {
  for (const entry of readdirSync(srcDir)) {
    if (EXCLUDED_DIR_NAMES.includes(entry)) {
      continue;
    }

    const srcPath = join(srcDir, entry);
    const destPath = join(destDir, entry);
    const stat = statSync(srcPath);

    if (stat.isDirectory()) {
      mkdirSync(destPath, { recursive: true });
      copyDirRecursive(srcPath, destPath);
    } else if (stat.isFile()) {
      copyFileSync(srcPath, destPath);
    }
  }
}
