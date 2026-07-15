/**
 * generate-compose.mjs — generates the per-app "isolation unit" docker-compose
 * YAML pairing the app-runtime image with the rv-runner image (T-5.3.1; the design spec "Isolation Pipeline & Dockerization").
 *
 * Pure function, no real I/O: the YAML text is returned to the caller, which
 * decides where (and whether) to write it. Uses the `yaml` package's
 * `stringify` rather than hand-rolled string templating, per this repo's
 * convention (see scripts/resolve-build-contract.mjs's use of `yaml`).
 *
 * AC-1: the runner only starts after the app reports `service_healthy`
 * (depends_on.condition) and the orchestrator blocks via
 * `--exit-code-from runner` (that flag lives in scripts/run-isolation-unit.mjs,
 * not here — this file only shapes the compose document itself).
 *
 * No top-level named `volumes:` block is declared: both mounts are bind
 * mounts (the app dir read-only, the results dir read-write), so there is
 * nothing for `docker compose down -v` to purge in this PoC shape. `down -v`
 * is still always invoked by the orchestrator (AC-2/hygiene) so that any
 * future named volume added to this template is purged for free without an
 * orchestrator change.
 */

import { stringify as yamlStringify } from 'yaml';

/**
 * @typedef {Object} GenerateComposeOptions
 * @property {string} appImageTag — the built app-runtime image tag
 * @property {string} runnerImageTag — the rv-runner image tag
 * @property {string} resultsHostDir — host directory mounted at /data/results
 * @property {string} appHostDir — host directory mounted read-only at /data/app
 * @property {string} [appConfigRelPath] — path to rippleview.config.yaml relative to
 *   appHostDir; defaults to 'rippleview.config.yaml'
 */

const DEFAULT_APP_CONFIG_REL_PATH = 'rippleview.config.yaml';

/**
 * Builds the compose document object (pre-stringify) so the YAML shaping and
 * the service topology stay easy to read independently.
 *
 * @param {GenerateComposeOptions} options
 * @returns {Record<string, unknown>}
 */
function buildComposeDocument({
  appImageTag,
  runnerImageTag,
  resultsHostDir,
  appHostDir,
  appConfigRelPath,
}) {
  const configRelPath = appConfigRelPath ?? DEFAULT_APP_CONFIG_REL_PATH;

  return {
    services: {
      app: {
        image: appImageTag,
      },
      runner: {
        image: runnerImageTag,
        depends_on: {
          app: {
            condition: 'service_healthy',
          },
        },
        environment: {
          BASE_URL: 'http://app:80',
        },
        volumes: [`${appHostDir}:/data/app:ro`, `${resultsHostDir}:/data/results`],
        command: ['run', '--config', `/data/app/${configRelPath}`, '--output', '/data/results'],
      },
    },
  };
}

/**
 * Generates the isolation-unit docker-compose YAML text for one app run.
 *
 * @param {GenerateComposeOptions} options
 * @returns {string} YAML document text
 */
export function generateComposeYaml(options) {
  const document = buildComposeDocument(options);
  return yamlStringify(document);
}
