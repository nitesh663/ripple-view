import { describe, it, expect } from 'vitest';
import { identityRedact, generateRunId, stampTenant } from './middleware.js';
import type { RunResult } from './types.js';
import type { RunContext } from '../config/schema.js';

// Helpers
const makeRunResult = (overrides: Partial<RunResult> = {}): RunResult => ({
  _id: 'test-id',
  tenant: 'ws:app',
  department: 'default',
  appName: 'app',
  verdict: 'pass',
  timestamp: '2026-01-01T00:00:00.000Z',
  durationMs: 0,
  findings: [],
  ...overrides,
});

const makeCtx = (overrides: Partial<RunContext> = {}): RunContext => ({
  tenant: 'my-ws:my-app',
  appName: 'my-app',
  department: 'payments',
  paths: { workspace: '/ws.yaml', app: '/app.yaml', output: '/out' },
  workspace: { version: '1', name: 'my-ws', packages: [], settings: { strict: false } },
  app: {
    department: 'payments',
    baseUrl: 'http://app:8080',
    hooks: {},
    matrix: [],
    visual: { threshold: 0.01 },
  },
  ...overrides,
});

describe('identityRedact', () => {
  it('returns the document unchanged', () => {
    const doc = makeRunResult();
    expect(identityRedact(doc)).toBe(doc); // same reference
  });
});

describe('generateRunId', () => {
  it('returns a non-empty string', () => {
    expect(typeof generateRunId()).toBe('string');
    expect(generateRunId().length).toBeGreaterThan(0);
  });
  it('uses the injected idGen', () => {
    expect(generateRunId(() => 'fixed-id')).toBe('fixed-id');
  });
});

describe('stampTenant', () => {
  it('stamps tenant, department, and appName from ctx', () => {
    const partial = {
      _id: 'id',
      verdict: 'pass' as const,
      timestamp: 'ts',
      durationMs: 0,
      findings: [],
    };
    const ctx = makeCtx();
    const result = stampTenant(partial, ctx);
    expect(result.tenant).toBe('my-ws:my-app');
    expect(result.department).toBe('payments');
    expect(result.appName).toBe('my-app');
  });
  it('preserves all fields from partial', () => {
    const partial = {
      _id: 'abc',
      verdict: 'fail' as const,
      timestamp: '2026',
      durationMs: 99,
      findings: [],
    };
    const result = stampTenant(partial, makeCtx());
    expect(result._id).toBe('abc');
    expect(result.verdict).toBe('fail');
    expect(result.durationMs).toBe(99);
  });
});
