import { join } from 'node:path';
import { writeFileSync, readFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import type { RunResult, ResultStore, RedactFn } from './types.js';
import { identityRedact } from './middleware.js';

// Injectable fs module — real fs by default; tests inject an in-memory mock or use a real temp dir
export interface FsMod {
  writeFileSync(path: string, data: string, encoding: 'utf8'): void;
  readFileSync(path: string, encoding: 'utf8'): string;
  mkdirSync(path: string, options: { recursive: boolean }): void;
  existsSync(path: string): boolean;
  readdirSync(path: string, options: { encoding: 'utf8' }): string[];
}

const realFs: FsMod = {
  writeFileSync: (p, d, e) => {
    writeFileSync(p, d, e);
  },
  readFileSync: (p, e) => readFileSync(p, e),
  mkdirSync: (p, o) => {
    mkdirSync(p, o);
  },
  existsSync,
  readdirSync: (p, o) => readdirSync(p, o),
};

/**
 * File-backed ResultStore.
 *
 * Path layout:
 *   <outputRoot>/results/<department>/<appName>/runs/<id>.json
 *
 * This layout provides:
 * - AC-1: runs/ documents exist under results/<dept>/<appName>/
 * - AC-2: two apps with different dept or appName write to different directories
 *
 * The shape is Mongo-document-shaped (G5) so the PoC files map 1:1 to
 * future Mongo collection documents without field-name changes.
 */
export class FileResultStore implements ResultStore {
  constructor(
    private readonly outputRoot: string,
    private readonly redact: RedactFn = identityRedact,
    private readonly fs: FsMod = realFs,
  ) {}

  async putRun(doc: RunResult): Promise<void> {
    const redacted = this.redact(doc);
    const dir = this.runDir(redacted.department, redacted.appName);
    this.fs.mkdirSync(dir, { recursive: true });
    const filePath = join(dir, `${redacted._id}.json`);
    this.fs.writeFileSync(filePath, JSON.stringify(redacted, null, 2), 'utf8');
  }

  async getRun(id: string): Promise<RunResult | undefined> {
    // Scan results/<dept>/<app>/runs/ directories for <id>.json
    // Acceptable at PoC scale; a Mongo adapter would query by _id.
    const resultsDir = join(this.outputRoot, 'results');
    if (!this.fs.existsSync(resultsDir)) return undefined;
    return this.scanForRun(resultsDir, id, 0);
  }

  private scanForRun(dir: string, id: string, depth: number): RunResult | undefined {
    if (depth > 4) return undefined; // guard against deep trees
    let entries: string[];
    try {
      entries = this.fs.readdirSync(dir, { encoding: 'utf8' });
    } catch {
      return undefined;
    }
    for (const entry of entries) {
      const full = join(dir, entry);
      if (entry === `${id}.json`) {
        try {
          return JSON.parse(this.fs.readFileSync(full, 'utf8')) as RunResult;
        } catch {
          return undefined;
        }
      }
      // Only recurse into known subdirectory names to keep scope tight
      if (depth < 4) {
        const found = this.scanForRun(full, id, depth + 1);
        if (found !== undefined) return found;
      }
    }
    return undefined;
  }

  private runDir(department: string, appName: string): string {
    return join(this.outputRoot, 'results', department, appName, 'runs');
  }
}
