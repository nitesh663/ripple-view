import type { FastifyInstance } from 'fastify';
import type { RegistryDocument } from '@rippleview/registry';
import type {
  FleetResponse,
  FleetChannel,
  FleetAppRow,
  FleetCell,
  DriftInfo,
} from '../../types.js';
import { computeDrift } from '../../drift.js';

const NONE_DRIFT: DriftInfo = { badge: 'none', majorsBehind: 0, minorsBehind: 0, patchesBehind: 0 };

function capitalize(s: string): string {
  return s.length === 0 ? s : (s[0] ?? '').toUpperCase() + s.slice(1);
}

export function buildFleetResponse(registry: RegistryDocument): FleetResponse {
  const channels: FleetChannel[] = [];

  for (const [framework, versionMap] of Object.entries(registry)) {
    for (const [generation, packageMap] of Object.entries(versionMap)) {
      const libraries = Object.keys(packageMap).sort();

      const allApps = new Set<string>();
      for (const entry of Object.values(packageMap)) {
        for (const appName of Object.keys(entry.consumers)) {
          allApps.add(appName);
        }
      }

      const latestVersions: Record<string, string> = {};
      for (const [lib, entry] of Object.entries(packageMap)) {
        latestVersions[lib] = entry.latest;
      }

      const appRows: FleetAppRow[] = [...allApps].sort().map((appName) => {
        const cells: FleetCell[] = libraries.map((lib): FleetCell => {
          const entry = packageMap[lib];
          if (!entry) return { library: lib, consumed: null, latest: '?', drift: NONE_DRIFT };
          const consumed = entry.consumers[appName] ?? null;
          const drift: DriftInfo = consumed ? computeDrift(consumed, entry.latest) : NONE_DRIFT;
          return { library: lib, consumed, latest: entry.latest, drift };
        });
        return { appName, department: 'default', cells };
      });

      channels.push({
        framework,
        generation,
        label: `${capitalize(framework)} ng${generation}`,
        libraries,
        latestVersions,
        apps: appRows,
      });
    }
  }

  return { channels };
}

export function registerFleetRoute(
  fastify: FastifyInstance,
  getRegistry: () => RegistryDocument,
): void {
  fastify.get('/api/fleet', async (_request, reply) => {
    const registry = getRegistry();
    const body: FleetResponse = buildFleetResponse(registry);
    return reply.send(body);
  });
}
