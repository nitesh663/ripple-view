import { join } from 'node:path';
import { writeFileSync, readFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import type { BundleManifest, BundleStore } from './types.js';

// Injectable fs module — real fs by default; tests inject a real temp dir
// (mirrors FileResultStore's FsMod pattern), extended with the sync calls
// this store needs to write binary archive content.
export interface BundleFsMod {
  writeFileSync(path: string, data: Buffer | string, encoding?: 'utf8'): void;
  readFileSync(path: string): Buffer;
  readFileSyncUtf8(path: string, encoding: 'utf8'): string;
  mkdirSync(path: string, options: { recursive: boolean }): void;
  existsSync(path: string): boolean;
  readdirSync(path: string, options: { encoding: 'utf8' }): string[];
}

const realFs: BundleFsMod = {
  writeFileSync: (p, d, e) => {
    if (e) {
      writeFileSync(p, d, e);
    } else {
      writeFileSync(p, d);
    }
  },
  readFileSync: (p) => readFileSync(p),
  readFileSyncUtf8: (p, e) => readFileSync(p, e),
  mkdirSync: (p, o) => {
    mkdirSync(p, o);
  },
  existsSync,
  readdirSync: (p, o) => readdirSync(p, o),
};

/** Minimal zip-extractor contract — implementations wrap a real zip library. */
export interface ZipExtractor {
  extractAll(archive: Buffer, destDir: string): void;
}

/**
 * Local-filesystem BundleStore — the PoC profile (AC-2).
 *
 * Path layout:
 *   <storeDir>/<appName>/<digest>.zip
 *   <storeDir>/<appName>/<digest>.manifest.json
 *   <storeDir>/<appName>/latest.json — { digest } of the most recent push (AC-3)
 *
 * `fetchBundle` is given only a digest (not appName, per the BundleStore SPI),
 * so it globs `<storeDir>/*\/<digest>.zip` to locate the owning app directory.
 * This keeps the SPI symmetric with the OCI profile (which also fetches by
 * digest alone) at the cost of an O(apps) directory scan — acceptable at PoC
 * scale; a future index file could make this O(1) without changing the SPI.
 */
export class LocalZipBundleStore implements BundleStore {
  constructor(
    private readonly storeDir: string,
    private readonly zip: ZipExtractor,
    private readonly fs: BundleFsMod = realFs,
  ) {}

  async putBundle(appName: string, archive: Buffer, manifest: BundleManifest): Promise<void> {
    const dir = this.appDir(appName);
    this.fs.mkdirSync(dir, { recursive: true });
    this.fs.writeFileSync(join(dir, `${manifest.digest}.zip`), archive);
    this.fs.writeFileSync(
      join(dir, `${manifest.digest}.manifest.json`),
      JSON.stringify(manifest, null, 2),
      'utf8',
    );
    this.fs.writeFileSync(
      join(dir, 'latest.json'),
      JSON.stringify({ digest: manifest.digest }, null, 2),
      'utf8',
    );
  }

  async getLatestBundle(appName: string): Promise<BundleManifest | undefined> {
    const dir = this.appDir(appName);
    const latestPath = join(dir, 'latest.json');
    if (!this.fs.existsSync(latestPath)) {
      return undefined;
    }
    try {
      const { digest } = JSON.parse(this.fs.readFileSyncUtf8(latestPath, 'utf8')) as {
        digest: string;
      };
      const manifestPath = join(dir, `${digest}.manifest.json`);
      if (!this.fs.existsSync(manifestPath)) {
        return undefined;
      }
      return JSON.parse(this.fs.readFileSyncUtf8(manifestPath, 'utf8')) as BundleManifest;
    } catch {
      return undefined;
    }
  }

  async fetchBundle(digest: string, destDir: string): Promise<void> {
    const zipPath = this.findZipByDigest(digest);
    if (zipPath === undefined) {
      throw new Error(`LocalZipBundleStore: no bundle found for digest ${digest}`);
    }
    this.fs.mkdirSync(destDir, { recursive: true });
    const archive = this.fs.readFileSync(zipPath);
    this.zip.extractAll(archive, destDir);
  }

  private findZipByDigest(digest: string): string | undefined {
    if (!this.fs.existsSync(this.storeDir)) {
      return undefined;
    }
    const appNames = this.fs.readdirSync(this.storeDir, { encoding: 'utf8' });
    for (const appName of appNames) {
      const candidate = join(this.storeDir, appName, `${digest}.zip`);
      if (this.fs.existsSync(candidate)) {
        return candidate;
      }
    }
    return undefined;
  }

  private appDir(appName: string): string {
    return join(this.storeDir, appName);
  }
}
