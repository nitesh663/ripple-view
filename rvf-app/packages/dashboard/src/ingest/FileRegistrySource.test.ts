import { describe, it, expect } from 'vitest';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { FileRegistrySource } from './FileRegistrySource.js';
import type { RegistryDocument } from '@rippleview/registry';

const FIXTURE: RegistryDocument = {
  angular: {
    '17': {
      '@op/core-controls': {
        latest: '17.3.0',
        consumers: { 'admin-app': '17.2.0', 'billing-app': '17.1.0' },
      },
    },
  },
};

function writeFixture(name: string, content: unknown): string {
  const dir = join(tmpdir(), 'rv-dashboard-test');
  mkdirSync(dir, { recursive: true });
  const path = join(dir, name);
  writeFileSync(path, JSON.stringify(content), 'utf8');
  return path;
}

describe('FileRegistrySource', () => {
  it('loads and validates a well-formed registry.json', () => {
    const path = writeFixture('registry-valid.json', FIXTURE);
    const source = new FileRegistrySource({ registryPath: path });
    const result = source.load();
    expect(result.angular?.['17']?.['@op/core-controls']?.latest).toBe('17.3.0');
    expect(result.angular?.['17']?.['@op/core-controls']?.consumers['admin-app']).toBe('17.2.0');
  });

  it('throws a Zod validation error for a malformed registry', () => {
    const path = writeFixture('registry-bad.json', {
      angular: { '17': { '@op/x': 'not-an-object' } },
    });
    const source = new FileRegistrySource({ registryPath: path });
    expect(() => source.load()).toThrow();
  });

  it('throws when the file does not exist', () => {
    const source = new FileRegistrySource({ registryPath: '/nonexistent/path/registry.json' });
    expect(() => source.load()).toThrow();
  });
});
