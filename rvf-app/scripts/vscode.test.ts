/**
 * Unit tests for  acceptance criteria.
 *
 * AC1: .vscode/settings.json exists with format-on-save, ESLint,
 *      default Prettier formatter, and workspace TS SDK configured.
 * AC2: .vscode/extensions.json lists all required extensions;
 *      .vscode/launch.json provides debug configs for Vitest and the CLI.
 *
 * All tests are pure JSON reads — no process spawning (G13 determinism).
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// AC1: .vscode/settings.json — format-on-save, ESLint, Prettier, TS SDK
// ---------------------------------------------------------------------------
describe('AC1: .vscode/settings.json exists', () => {
  it('file exists', () => {
    expect(existsSync(path.join(repoRoot, '.vscode', 'settings.json'))).toBe(true);
  });
});

describe('AC1: settings.json — editor configuration', () => {
  const settingsPath = path.join(repoRoot, '.vscode', 'settings.json');
  const settings: Record<string, unknown> = existsSync(settingsPath)
    ? (JSON.parse(readFileSync(settingsPath, 'utf8')) as Record<string, unknown>)
    : {};

  it('editor.formatOnSave === true', () => {
    expect(settings['editor.formatOnSave']).toBe(true);
  });

  it('editor.defaultFormatter === "esbenp.prettier-vscode"', () => {
    expect(settings['editor.defaultFormatter']).toBe('esbenp.prettier-vscode');
  });

  it('editor.codeActionsOnSave has source.fixAll.eslint defined', () => {
    const codeActionsOnSave = settings['editor.codeActionsOnSave'] as
      | Record<string, unknown>
      | undefined;
    expect(codeActionsOnSave).toBeDefined();
    expect(codeActionsOnSave?.['source.fixAll.eslint']).toBeDefined();
  });

  it('eslint.useFlatConfig === true', () => {
    expect(settings['eslint.useFlatConfig']).toBe(true);
  });

  it('typescript.tsdk is defined and contains "typescript"', () => {
    const tsdk = settings['typescript.tsdk'] as string | undefined;
    expect(tsdk).toBeDefined();
    expect(tsdk).toContain('typescript');
  });

  it('typescript.enablePromptUseWorkspaceTsdk === true', () => {
    expect(settings['typescript.enablePromptUseWorkspaceTsdk']).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// AC2: .vscode/extensions.json — required extension recommendations
// ---------------------------------------------------------------------------
describe('AC2: .vscode/extensions.json exists', () => {
  it('file exists', () => {
    expect(existsSync(path.join(repoRoot, '.vscode', 'extensions.json'))).toBe(true);
  });
});

describe('AC2: extensions.json — recommendations', () => {
  const extensionsPath = path.join(repoRoot, '.vscode', 'extensions.json');
  const extensions: { recommendations: string[] } = existsSync(extensionsPath)
    ? (JSON.parse(readFileSync(extensionsPath, 'utf8')) as { recommendations: string[] })
    : { recommendations: [] };

  const recommendations = extensions.recommendations;

  it('includes "dbaeumer.vscode-eslint"', () => {
    expect(recommendations).toContain('dbaeumer.vscode-eslint');
  });

  it('includes "esbenp.prettier-vscode"', () => {
    expect(recommendations).toContain('esbenp.prettier-vscode');
  });

  it('includes "ms-playwright.playwright"', () => {
    expect(recommendations).toContain('ms-playwright.playwright');
  });

  it('includes "editorconfig.editorconfig"', () => {
    expect(recommendations).toContain('editorconfig.editorconfig');
  });

  it('includes "vitest.explorer"', () => {
    expect(recommendations).toContain('vitest.explorer');
  });
});

// ---------------------------------------------------------------------------
// AC2: .vscode/launch.json — debug configurations
// ---------------------------------------------------------------------------
describe('AC2: .vscode/launch.json exists', () => {
  it('file exists', () => {
    expect(existsSync(path.join(repoRoot, '.vscode', 'launch.json'))).toBe(true);
  });
});

describe('AC2: launch.json — debug configurations', () => {
  const launchPath = path.join(repoRoot, '.vscode', 'launch.json');
  const launch: { version: string; configurations: { name: string }[] } = existsSync(launchPath)
    ? (JSON.parse(readFileSync(launchPath, 'utf8')) as {
        version: string;
        configurations: { name: string }[];
      })
    : { version: '', configurations: [] };

  it('version === "0.2.0"', () => {
    expect(launch.version).toBe('0.2.0');
  });

  it('configurations array has at least 2 items', () => {
    expect(launch.configurations.length).toBeGreaterThanOrEqual(2);
  });

  it('has a configuration named "Debug Vitest"', () => {
    const names = launch.configurations.map((c) => c.name);
    expect(names).toContain('Debug Vitest');
  });

  it('has a configuration named "Debug rv CLI"', () => {
    const names = launch.configurations.map((c) => c.name);
    expect(names).toContain('Debug rv CLI');
  });
});
