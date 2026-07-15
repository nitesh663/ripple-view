import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  selectImpactedConsumers,
  type ImpactedConsumer,
  type RegistryDocument,
} from '@rippleview/registry';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RegistryImpactSelectOptions {
  /** Path to a registry.json produced by `rv registry scan`. */
  registry: string;
  framework: string;
  generation: string;
  package: string;
  /** Directory where `impact.json` is written. Defaults to `process.cwd()`. */
  output?: string;
  /** Injectable writer — defaults to `fs.writeFileSync`. */
  writeFile?: (path: string, content: string) => void;
}

export interface RegistryImpactSelectResult {
  exitCode: number;
  selected?: ImpactedConsumer[];
}

function defaultWriteFile(path: string, content: string): void {
  writeFileSync(path, content, 'utf8');
}

// ── registryImpactSelectCommand ───────────────────────────────────────────────

/**
 * Load a registry.json, select the consumers impacted by a candidate
 * change to one package within one framework/generation bucket, and write
 * impact.json (RippleView_DESIGN.md / RippleView_IMPLEMENTATION.md③).
 *
 * Never throws — all errors are caught and returned as `{ exitCode: 1 }`
 * (G7/G10).
 */
export async function registryImpactSelectCommand(
  opts: RegistryImpactSelectOptions,
): Promise<RegistryImpactSelectResult> {
  const outputDir = opts.output ?? process.cwd();
  const writeFile = opts.writeFile ?? defaultWriteFile;

  let registry: RegistryDocument;
  try {
    const raw = readFileSync(opts.registry, 'utf8');
    registry = JSON.parse(raw) as RegistryDocument;
  } catch {
    return { exitCode: 1 };
  }

  const selected = selectImpactedConsumers({
    registry,
    framework: opts.framework,
    generation: opts.generation,
    packageName: opts.package,
  });

  try {
    writeFile(join(outputDir, 'impact.json'), JSON.stringify(selected, null, 2));
  } catch {
    return { exitCode: 1, selected };
  }

  return { exitCode: 0, selected };
}
