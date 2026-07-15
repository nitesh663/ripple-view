/**
 * validate.mjs — CLI validator for fixtures.manifest.json.
 *
 * Validates the committed manifest against the schema and prints a
 * signal-coverage summary. Exits non-zero on any validation failure so this
 * can gate CI in a later story without further changes.
 *
 * Usage: node fixtures/validate.mjs
 */

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { FixturesManifestSchema, SIGNALS } from './schema.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const manifestPath = join(repoRoot, 'fixtures.manifest.json');

function main() {
  if (!existsSync(manifestPath)) {
    process.stderr.write(`validate:fixtures: ${manifestPath} not found\n`);
    process.exit(1);
  }

  const raw = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const result = FixturesManifestSchema.safeParse(raw);

  if (!result.success) {
    process.stderr.write('validate:fixtures: fixtures.manifest.json is INVALID\n');
    for (const issue of result.error.issues) {
      process.stderr.write(`  - ${issue.path.join('.')}: ${issue.message}\n`);
    }
    process.exit(1);
  }

  const { fixtures } = result.data;
  const coveredSignals = new Set(fixtures.map((f) => f.signal));
  const missing = SIGNALS.filter((s) => !coveredSignals.has(s));

  process.stdout.write(`validate:fixtures: ${fixtures.length} fixture(s) validated OK\n`);
  for (const signal of SIGNALS) {
    const count = fixtures.filter((f) => f.signal === signal).length;
    process.stdout.write(`  [${count > 0 ? 'x' : ' '}] ${signal} (${count})\n`);
  }

  if (missing.length > 0) {
    process.stderr.write(`validate:fixtures: missing signal coverage: ${missing.join(', ')}\n`);
    process.exit(1);
  }
}

main();
