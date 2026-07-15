import { join } from 'node:path';
import { loadWorkspaceConfig } from '@rippleview/core';
import { scanRegistry } from '@rippleview/registry';

export interface RegistryRegisterOptions {
  workspace: string;
  target: string;
  roots?: string[];
  env?: Record<string, string | undefined>;
}

/**
 * Scan a workspace and push the resulting RegistryDocument to a running dashboard.
 * Never throws — errors are reported to stderr and returned as exitCode 1.
 */
export async function registryRegisterCommand(
  opts: RegistryRegisterOptions,
): Promise<{ exitCode: number }> {
  const env = opts.env ?? process.env;

  let workspaceConfig;
  try {
    workspaceConfig = loadWorkspaceConfig(opts.workspace, env);
  } catch (e) {
    process.stderr.write(
      `Failed to load workspace config from "${opts.workspace}": ${String(e)}\n`,
    );
    return { exitCode: 1 };
  }

  const roots = opts.roots ?? [join(opts.workspace, '..')];

  let registry;
  try {
    registry = scanRegistry({ roots, trackedPackages: workspaceConfig.packages });
  } catch (e) {
    process.stderr.write(`Failed to scan workspace: ${String(e)}\n`);
    return { exitCode: 1 };
  }

  const url = `${opts.target.replace(/\/$/, '')}/api/register`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registry),
    });
  } catch (e) {
    process.stderr.write(`Cannot reach dashboard at ${url}: ${String(e)}\n`);
    return { exitCode: 1 };
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    process.stderr.write(`Registration failed (HTTP ${String(response.status)}): ${body}\n`);
    return { exitCode: 1 };
  }

  const channelCount = Object.values(registry).reduce(
    (acc, genMap) => acc + Object.keys(genMap).length,
    0,
  );
  process.stdout.write(`Registered ${String(channelCount)} channel(s) to ${url}\n`);
  return { exitCode: 0 };
}
