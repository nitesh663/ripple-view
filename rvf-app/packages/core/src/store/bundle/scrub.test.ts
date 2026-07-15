import { describe, it, expect } from 'vitest';
import { shouldExcludePath, shouldScrubFile } from './scrub.js';

// AC-1: excluded directories never reach the archive
describe('AC-1: shouldExcludePath', () => {
  it('excludes a top-level node_modules segment', () => {
    expect(shouldExcludePath('node_modules/lodash/index.js')).toBe(true);
  });

  it('excludes a nested .git segment', () => {
    expect(shouldExcludePath('apps/web/.git/HEAD')).toBe(true);
  });

  it('excludes a nested dist segment', () => {
    expect(shouldExcludePath('packages/app/dist/main.js')).toBe(true);
  });

  it('does not exclude a directory that merely starts with the excluded name', () => {
    expect(shouldExcludePath('node_modules_backup/foo.js')).toBe(false);
  });

  it('does not exclude a directory that merely contains the excluded name as a substring', () => {
    expect(shouldExcludePath('my-dist-tools/index.js')).toBe(false);
  });

  it('does not exclude ordinary source paths', () => {
    expect(shouldExcludePath('src/index.ts')).toBe(false);
  });
});

// AC-1: secret-bearing files are scrubbed entirely
describe('AC-1: shouldScrubFile', () => {
  it('scrubs a top-level .env file', () => {
    expect(shouldScrubFile('.env')).toBe(true);
  });

  it('scrubs .env.production via the .env.* pattern', () => {
    expect(shouldScrubFile('.env.production')).toBe(true);
  });

  it('scrubs a nested .npmrc', () => {
    expect(shouldScrubFile('apps/web/.npmrc')).toBe(true);
  });

  it('scrubs a *.pem certificate file', () => {
    expect(shouldScrubFile('certs/server.pem')).toBe(true);
  });

  it('scrubs a *.key file', () => {
    expect(shouldScrubFile('certs/private.key')).toBe(true);
  });

  it('does not scrub rippleview.config.yaml', () => {
    expect(shouldScrubFile('rippleview.config.yaml')).toBe(false);
  });

  it('does not scrub a lockfile', () => {
    expect(shouldScrubFile('package-lock.json')).toBe(false);
  });

  it('does not scrub a file that merely contains "env" in its name', () => {
    expect(shouldScrubFile('environment.ts')).toBe(false);
  });
});
