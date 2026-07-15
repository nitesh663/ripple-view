/**
 * Unit tests for  acceptance criteria.
 *
 * AC-1: docs/CONTRIBUTING.md exists and mentions all 5 required tools.
 * AC-2: preflight logic (checkTool + runPreflight) behaves correctly with
 *        mock executors — no real execSync is ever called (G13 determinism).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

// allowJs + moduleResolution:bundler lets TypeScript resolve this .mjs module.
import { checkTool, runPreflight, TOOLS } from './preflight.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// AC-1: onboarding doc exists and covers all prerequisite tools
// ---------------------------------------------------------------------------
describe('AC-1: docs/CONTRIBUTING.md', () => {
  const docPath = path.join(repoRoot, 'docs', 'CONTRIBUTING.md');

  it('exists', () => {
    expect(existsSync(docPath)).toBe(true);
  });

  let content = '';
  beforeEach(() => {
    if (existsSync(docPath)) {
      content = readFileSync(docPath, 'utf8');
    }
  });

  it('mentions "Node 20"', () => {
    expect(content).toContain('Node 20');
  });

  it('mentions "npm"', () => {
    expect(content).toContain('npm');
  });

  it('mentions "Docker"', () => {
    expect(content).toContain('Docker');
  });

  it('mentions "Git"', () => {
    expect(content).toContain('Git');
  });

  it('mentions "VSCode"', () => {
    expect(content).toContain('VSCode');
  });

  it('instructs contributors to run scripts/preflight.mjs', () => {
    expect(content).toContain('scripts/preflight.mjs');
  });
});

// ---------------------------------------------------------------------------
// AC-2a: checkTool returns { pass: true } when executor returns a version string
// ---------------------------------------------------------------------------
describe('AC-2a: checkTool — executor returns version string', () => {
  it('returns status "pass" for a generic tool', () => {
    const mockExecutor = vi.fn().mockReturnValue('1.2.3\n');
    const result = checkTool('pnpm', 'pnpm --version', mockExecutor);
    expect(result.status).toBe('pass');
    expect(mockExecutor).toHaveBeenCalledWith('pnpm --version');
  });

  it('trims the returned version string', () => {
    const mockExecutor = vi.fn().mockReturnValue('  9.15.4\n');
    const result = checkTool('pnpm', 'pnpm --version', mockExecutor);
    expect(result.version).toBe('9.15.4');
  });
});

// ---------------------------------------------------------------------------
// AC-2b: checkTool returns { pass: false } when executor throws (tool not found)
// ---------------------------------------------------------------------------
describe('AC-2b: checkTool — executor throws', () => {
  it('returns status "fail" when executor throws ENOENT', () => {
    const err = Object.assign(new Error('spawn pnpm ENOENT'), { code: 'ENOENT' });
    const mockExecutor = vi.fn().mockImplementation(() => {
      throw err;
    });
    const result = checkTool('pnpm', 'pnpm --version', mockExecutor);
    expect(result.status).toBe('fail');
  });

  it('includes the error message in the version field', () => {
    const mockExecutor = vi.fn().mockImplementation(() => {
      throw new Error('Command failed');
    });
    const result = checkTool('docker', 'docker --version', mockExecutor);
    expect(result.status).toBe('fail');
    expect(result.version).toMatch(/Command failed|not found/);
  });
});

// ---------------------------------------------------------------------------
// AC-2c: node version check fails when major < 20
// ---------------------------------------------------------------------------
describe('AC-2c: node version check — major < 20 fails', () => {
  it('fails for v18.0.0', () => {
    const mockExecutor = vi.fn().mockReturnValue('v18.0.0\n');
    const nodeTool = TOOLS.find((t: { name: string }) => t.name === 'node');
    expect(nodeTool).toBeDefined();
    if (!nodeTool) return;
    const result = checkTool('node', nodeTool.cmd, mockExecutor, nodeTool.check);
    expect(result.status).toBe('fail');
  });

  it('fails for v16.20.0', () => {
    const mockExecutor = vi.fn().mockReturnValue('v16.20.0\n');
    const nodeTool = TOOLS.find((t: { name: string }) => t.name === 'node');
    expect(nodeTool).toBeDefined();
    if (!nodeTool) return;
    const result = checkTool('node', nodeTool.cmd, mockExecutor, nodeTool.check);
    expect(result.status).toBe('fail');
  });
});

// ---------------------------------------------------------------------------
// AC-2d: node version check passes when major >= 20
// ---------------------------------------------------------------------------
describe('AC-2d: node version check — major >= 20 passes', () => {
  it('passes for v20.0.0', () => {
    const mockExecutor = vi.fn().mockReturnValue('v20.0.0\n');
    const nodeTool = TOOLS.find((t: { name: string }) => t.name === 'node');
    expect(nodeTool).toBeDefined();
    if (!nodeTool) return;
    const result = checkTool('node', nodeTool.cmd, mockExecutor, nodeTool.check);
    expect(result.status).toBe('pass');
  });

  it('passes for v22.1.0', () => {
    const mockExecutor = vi.fn().mockReturnValue('v22.1.0\n');
    const nodeTool = TOOLS.find((t: { name: string }) => t.name === 'node');
    expect(nodeTool).toBeDefined();
    if (!nodeTool) return;
    const result = checkTool('node', nodeTool.cmd, mockExecutor, nodeTool.check);
    expect(result.status).toBe('pass');
  });
});

// ---------------------------------------------------------------------------
// AC-2e: runPreflight returns 0 when all hard tools pass
// ---------------------------------------------------------------------------
describe('AC-2e: runPreflight — all hard tools pass returns 0', () => {
  let stdoutSpy!: { mockRestore(): void };

  beforeEach(() => {
    stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    stdoutSpy.mockRestore();
  });

  it('returns 0 when executor succeeds for all tools', () => {
    const mockExecutor = vi.fn().mockImplementation((cmd: string) => {
      if (cmd.includes('node')) return 'v20.12.0\n';
      return '1.0.0\n';
    });

    const failures = runPreflight(mockExecutor);
    expect(failures).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// AC-2f: runPreflight returns > 0 when a hard tool fails
// ---------------------------------------------------------------------------
describe('AC-2f: runPreflight — hard tool fail returns > 0', () => {
  let stdoutSpy!: { mockRestore(): void };

  beforeEach(() => {
    stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    stdoutSpy.mockRestore();
  });

  it('returns 1 when node version is too old', () => {
    const mockExecutor = vi.fn().mockImplementation((cmd: string) => {
      if (cmd.includes('node')) return 'v18.0.0\n';
      return '1.0.0\n';
    });

    const failures = runPreflight(mockExecutor);
    expect(failures).toBeGreaterThan(0);
  });

  it('returns > 0 when a hard tool throws', () => {
    const mockExecutor = vi.fn().mockImplementation((cmd: string) => {
      if (cmd.includes('node')) return 'v20.0.0\n';
      if (cmd.includes('docker')) throw new Error('docker not found');
      return '1.0.0\n';
    });

    const failures = runPreflight(mockExecutor);
    expect(failures).toBeGreaterThan(0);
  });
});
