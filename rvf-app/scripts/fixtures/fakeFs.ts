/**
 * fakeFs.ts — in-memory fake filesystem helper for  orchestration
 * tests. Shared between inject-override.test.ts and
 * inject-override.merge.test.ts so neither test file touches the real
 * filesystem (G13 determinism).
 */

import { vi } from 'vitest';

/**
 * Builds an in-memory fake filesystem keyed by absolute-ish path strings,
 * plus the matching readFileFn/writeFileFn/existsFn trio.
 */
export function makeFakeFs(initialFiles: Record<string, string>) {
  const files = new Map(Object.entries(initialFiles));

  const readFileFn = vi.fn((path: string) => {
    const content = files.get(path);
    if (content === undefined) {
      throw new Error(`ENOENT: ${path}`);
    }
    return content;
  });

  const writeFileFn = vi.fn((path: string, content: string) => {
    files.set(path, content);
  });

  const existsFn = vi.fn((path: string) => files.has(path));

  return { files, readFileFn, writeFileFn, existsFn };
}
