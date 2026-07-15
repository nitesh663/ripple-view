# @rippleview/cli

The `rv` command-line interface — the only contract between RippleView and CI. Every environment (local, Jenkins, Docker) invokes the engine identically through this CLI.

Design source of truth: [The Agnostic Engine & Configuration design doc]().

## Commands

| Command         | Status | Description                                                |
| --------------- | ------ | ---------------------------------------------------------- |
| `rv run`      | Active | Run semantic validation against an app                     |
| `rv gate`     | Stub   | Run the quality gate (bring up local compose if `--local`) |
| `rv crawl`    | Stub   | Crawl an app to discover semantic anchors                  |
| `rv scan`     | Stub   | Scan for visual regressions against a baseline             |
| `rv baseline` | Stub   | Capture a new visual baseline                              |
| `rv report`   | Stub   | Generate an HTML report from run results                   |
| `rv init`     | Stub   | Initialise RippleView config files for an app                    |

Stub commands exit 1 with "not yet implemented" until their story is delivered.

## Usage

```bash
# Run validation for an app
rv run --config apps/my-app/rippleview.config.yaml

# Write results to a specific directory
rv run --config apps/my-app/rippleview.config.yaml --output ./runs/my-app

# Show all commands
rv --help

# Show help for a specific command
rv run --help
```

## `rv run`

```
Options:
  -c, --config <path>   path to app rippleview.config.yaml  (required)
  -o, --output <dir>    output directory for results   (default: cwd)
  -V, --version         output the version number
  -h, --help            display help for command
```

**Exit codes:**

- `0` — validation passed
- `1` — validation failed, config error, or any other failure

**Config resolution:**

1. `--config` is treated as the path to the app's `rippleview.config.yaml`.
2. The workspace config (`rippleview.workspace.yaml`) is discovered by walking parent directories from the app config file upward. If not found, a minimal fallback workspace is used (skeleton stage).
3. Both files are validated via `@rippleview/core` Zod schemas. A schema error exits 1 with the invalid field path in the message.

## `summary.json`

Every `rv run` writes a `summary.json` to the output directory (default: `cwd`). The file is Mongo-document-shaped (G5) so the PoC writes exactly the shape a future database collection will store.

```json
{
  "tenant": "my-workspace:my-app",
  "verdict": "pass",
  "timestamp": "2026-06-17T10:00:00.000Z",
  "durationMs": 42,
  "findings": []
}
```

| Field        | Type               | Description                                                 |
| ------------ | ------------------ | ----------------------------------------------------------- |
| `tenant`     | `string`           | `workspace.name:appName` — uniquely identifies the run      |
| `verdict`    | `"pass" \| "fail"` | Overall result                                              |
| `timestamp`  | ISO 8601           | When the run started                                        |
| `durationMs` | `number`           | Wall-clock duration                                         |
| `findings`   | `unknown[]`        | Per-component findings (populated by future engine stories) |

## Programmatic API

The CLI is also importable for use in scripts and tests:

```ts
import { program, run, VERSION } from '@rippleview/cli';

// Dispatch commands programmatically (e.g. in integration tests)
await run(['node', 'rv', 'run', '--config', 'apps/my-app/rippleview.config.yaml']);

// Access the commander program directly
const commandNames = program.commands.map((c) => c.name());
```

For unit tests, prefer calling `runCommand` from `@rippleview/cli/commands/run` directly — it accepts injectable `writeSummary` and `mkdirp` overrides for full determinism (G13):

```ts
import { runCommand } from '@rippleview/cli/src/commands/run.js';

const result = await runCommand({
  config: '/path/to/rippleview.config.yaml',
  output: '/tmp/results',
  writeSummary: (record, _dir) => {
    /* capture in test */
  },
  mkdirp: () => {
    /* no-op */
  },
});

expect(result.exitCode).toBe(0);
expect(result.summary.verdict).toBe('pass');
```

## Development

```bash
# Build (compiles both index.ts and cli.ts entry points)
npm run build -w @rippleview/cli

# Test
npm run test -w @rippleview/cli

# Lint
npm run lint -w @rippleview/cli

# Run the CLI directly from source (after build)
node packages/cli/dist/cli.js --help
```
