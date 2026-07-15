import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdirSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { FileResultStore } from './FileResultStore.js';
import { stampTenant } from './middleware.js';
import type { RunResult } from './types.js';
import type { RunContext } from '../config/schema.js';

// Deterministic IDs — injected so tests are reproducible (G13)
const ID_A = 'run-aaaa-1111';
const ID_B = 'run-bbbb-2222';

const makeCtx = (appName: string, department: string): RunContext => ({
  tenant: `ws:${appName}`,
  appName,
  department,
  paths: { workspace: '/ws.yaml', app: '/app.yaml', output: '/out' },
  workspace: { version: '1', name: 'ws', packages: [], settings: { strict: false } },
  app: {
    department,
    baseUrl: 'http://app:8080',
    hooks: {},
    matrix: [],
    visual: { threshold: 0.01 },
  },
});

const makePartial = (id: string): Omit<RunResult, 'tenant' | 'department' | 'appName'> => ({
  _id: id,
  verdict: 'pass',
  timestamp: '2026-01-01T00:00:00.000Z',
  durationMs: 10,
  findings: [],
});

let testRoot: string;

beforeAll(() => {
  testRoot = join(tmpdir(), `rv-store-test-${Date.now()}`);
  mkdirSync(testRoot, { recursive: true });
});

afterAll(() => {
  rmSync(testRoot, { recursive: true, force: true });
});

// AC-1: documents exist under results/<dept>/<appName>/runs/
describe('AC-1: putRun writes document to correct path', () => {
  it('creates the runs directory and writes the JSON file', async () => {
    const store = new FileResultStore(testRoot);
    const ctx = makeCtx('checkout-web', 'payments');
    const doc = stampTenant(makePartial(ID_A), ctx);
    await store.putRun(doc);

    const expectedPath = join(
      testRoot,
      'results',
      'payments',
      'checkout-web',
      'runs',
      `${ID_A}.json`,
    );
    expect(existsSync(expectedPath)).toBe(true);
  });

  it('written document matches RunResult shape (G5)', async () => {
    const { readFileSync } = await import('node:fs');
    const filePath = join(testRoot, 'results', 'payments', 'checkout-web', 'runs', `${ID_A}.json`);
    const parsed = JSON.parse(readFileSync(filePath, 'utf8')) as RunResult;
    expect(parsed._id).toBe(ID_A);
    expect(parsed.tenant).toBe('ws:checkout-web');
    expect(parsed.department).toBe('payments');
    expect(parsed.appName).toBe('checkout-web');
    expect(parsed.verdict).toBe('pass');
    expect(Array.isArray(parsed.findings)).toBe(true);
  });

  it('getRun retrieves the document by id', async () => {
    const store = new FileResultStore(testRoot);
    const result = await store.getRun(ID_A);
    expect(result?._id).toBe(ID_A);
  });
});

// AC-2: two apps write to different directories — no collision
describe('AC-2: path isolation between apps', () => {
  it('two apps in same dept write to different directories', async () => {
    const store = new FileResultStore(testRoot);
    const ctxA = makeCtx('app-alpha', 'platform');
    const ctxB = makeCtx('app-beta', 'platform');
    const docA = stampTenant(makePartial('run-alpha'), ctxA);
    const docB = stampTenant(makePartial('run-beta'), ctxB);
    await store.putRun(docA);
    await store.putRun(docB);

    const pathA = join(testRoot, 'results', 'platform', 'app-alpha', 'runs', 'run-alpha.json');
    const pathB = join(testRoot, 'results', 'platform', 'app-beta', 'runs', 'run-beta.json');
    expect(existsSync(pathA)).toBe(true);
    expect(existsSync(pathB)).toBe(true);
    // Directories are distinct
    expect(pathA).not.toBe(pathB);
  });

  it('two apps in different depts write to different directories', async () => {
    const store = new FileResultStore(testRoot);
    const ctxA = makeCtx('my-app', 'dept-a');
    const ctxB = makeCtx('my-app', 'dept-b'); // same appName, different dept
    const docA = stampTenant(makePartial('run-dept-a'), ctxA);
    const docB = stampTenant(makePartial('run-dept-b'), ctxB);
    await store.putRun(docA);
    await store.putRun(docB);

    const pathA = join(testRoot, 'results', 'dept-a', 'my-app', 'runs', 'run-dept-a.json');
    const pathB = join(testRoot, 'results', 'dept-b', 'my-app', 'runs', 'run-dept-b.json');
    expect(existsSync(pathA)).toBe(true);
    expect(existsSync(pathB)).toBe(true);
  });

  it('getRun returns undefined for an unknown id', async () => {
    const store = new FileResultStore(testRoot);
    const result = await store.getRun('nonexistent-id');
    expect(result).toBeUndefined();
  });
});

// Redaction hook placeholder (T-1.3.3)
describe('T-1.3.3: redaction hook', () => {
  it('applies the redact function before writing', async () => {
    const { readFileSync } = await import('node:fs');
    const redact = (doc: RunResult): RunResult => ({ ...doc, appName: '[REDACTED]' });
    const store = new FileResultStore(testRoot, redact);
    const ctx = makeCtx('sensitive-app', 'secure');
    const doc = stampTenant(makePartial(ID_B), ctx);
    await store.putRun(doc);

    // The store writes to the path derived from the *redacted* document,
    // so appName in the path is '[REDACTED]' after redaction.
    const filePath = join(testRoot, 'results', 'secure', '[REDACTED]', 'runs', `${ID_B}.json`);
    const parsed = JSON.parse(readFileSync(filePath, 'utf8')) as RunResult;
    expect(parsed.appName).toBe('[REDACTED]');
  });
});
