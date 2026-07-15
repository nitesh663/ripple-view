import { Command } from 'commander';
import { runCommand } from './commands/run.js';
import { bundleCommand } from './commands/bundle.js';
import { gateCommand } from './commands/gate.js';
import { registryScanCommand } from './commands/registry-scan.js';
import { registryImpactSelectCommand } from './commands/registry-impact-select.js';
import { generateAnchorsCommand } from './commands/generate-anchors.js';
import { checkAnchorsCommand } from './commands/check-anchors.js';
import { checkLockstepCommand } from './commands/check-lockstep.js';
import { dashboardCommand } from './commands/dashboard.js';
import { registryRegisterCommand } from './commands/registry-register.js';
import { stubCommand } from './commands/stubs.js';

// ── Version ───────────────────────────────────────────────────────────────────

export const VERSION = '0.0.0';

// ── Stub descriptions ─────────────────────────────────────────────────────────

const stubDescriptions: Record<string, string> = {
  crawl: 'Crawl an app to discover semantic anchors',
  scan: 'Scan for visual regressions against a baseline',
  baseline: 'Capture a new visual baseline',
  report: 'Generate an HTML report from run results',
  init: 'Initialise RippleView config files for an app',
};

// ── Program ───────────────────────────────────────────────────────────────────

export const program = new Command('rv')
  .description('Enterprise Semantic Validation Framework CLI')
  .version(VERSION);

// ── run command ───────────────────────────────────────────────────────────────

program
  .command('run')
  .description('Run semantic validation against an app')
  .requiredOption('-c, --config <path>', 'path to app rippleview.config.yaml')
  .option('-o, --output <dir>', 'output directory for results', process.cwd())
  .action(async (opts: { config: string; output: string }) => {
    const result = await runCommand({ config: opts.config, output: opts.output });
    process.exit(result.exitCode);
  });

// ── bundle command ───────────────────────────────────────────────────────────

program
  .command('bundle')
  .description('Pack a consumer app into a content-addressed bundle and push it to the BundleStore')
  .requiredOption('-a, --app <dir>', 'consumer app directory to bundle')
  .option('-n, --name <appName>', 'bundle name (defaults to the app directory basename)')
  .option(
    '-w, --workspace <path>',
    'path to rippleview.workspace.yaml (discovered by walking up from --app if omitted)',
  )
  .action(async (opts: { app: string; name?: string; workspace?: string }) => {
    const result = await bundleCommand({
      app: opts.app,
      ...(opts.name !== undefined && { name: opts.name }),
      ...(opts.workspace !== undefined && { workspace: opts.workspace }),
    });
    process.exit(result.exitCode);
  });

// ── gate command ──────────────────────────────────────────────────────────────

program
  .command('gate')
  .description('Run the quality gate (isolation unit) against an app directory already on disk')
  .option('--local', 'run the local, in-process compose isolation unit (only mode implemented in )')
  .requiredOption('-a, --app <dir>', 'consumer app directory to gate')
  .option(
    '-p, --package <name>',
    'candidate package name to version-swap in (with --candidate-version)',
  )
  .option(
    '--candidate-version <spec>',
    'candidate version spec to version-swap in (with --package). Named to avoid colliding with the ' +
      'CLI\'s own reserved --version flag (commander\'s program.version() intercepts a bare "--version" ' +
      "anywhere in argv, regardless of subcommand — found as a real, pre-existing bug while wiring 's " +
      'check-lockstep command, which hit the identical collision)',
  )
  .option('-o, --output <dir>', 'output directory for summary.json', process.cwd())
  .action(
    async (opts: {
      local?: boolean;
      app: string;
      package?: string;
      candidateVersion?: string;
      output: string;
    }) => {
      const result = await gateCommand({
        local: opts.local ?? false,
        app: opts.app,
        output: opts.output,
        ...(opts.package !== undefined && { package: opts.package }),
        ...(opts.candidateVersion !== undefined && { version: opts.candidateVersion }),
      });
      process.exit(result.exitCode);
    },
  );

// ── registry command (parent — shares this namespace) ────────────
//
// Deliberately nested (`rv registry scan`, not a flat `rv scan`) — the
// flat `scan` name is already claimed by the (stub) visual-regression scan
// below. `registry` is the noun (the knowledge plane, RippleView_DESIGN.md);
// `scan` and `impact-select` are the two verbs on it.

const registryProgram = program.command('registry').description('Knowledge registry');

registryProgram
  .command('scan')
  .description(
    'Scan repos for package.json files and produce registry.json (framework -> library -> consumers)',
  )
  .requiredOption('-w, --workspace <path>', 'path to rippleview.workspace.yaml')
  .option(
    '-r, --root <dir>',
    "repo root to scan (repeatable; defaults to the workspace file's own directory)",
    (value: string, previous: string[] | undefined) => [...(previous ?? []), value],
  )
  .option('-o, --output <dir>', 'output directory for registry.json', process.cwd())
  .option(
    '-m, --mode <mode>',
    'on-demand (default) or nightly (also writes a timestamped snapshot)',
    'on-demand',
  )
  .action(async (opts: { workspace: string; root?: string[]; output: string; mode: string }) => {
    if (opts.mode !== 'on-demand' && opts.mode !== 'nightly') {
      process.stderr.write(`Invalid --mode "${opts.mode}" — expected "on-demand" or "nightly"\n`);
      process.exit(1);
    }
    const result = await registryScanCommand({
      workspace: opts.workspace,
      output: opts.output,
      mode: opts.mode,
      ...(opts.root !== undefined && { roots: opts.root }),
    });
    process.exit(result.exitCode);
  });

registryProgram
  .command('register')
  .description('Scan a workspace and register it with a running dashboard')
  .requiredOption('-w, --workspace <path>', 'path to rippleview.workspace.yaml')
  .option('-t, --target <url>', 'dashboard URL to register with', 'http://localhost:9999')
  .option(
    '-r, --root <dir>',
    "repo root to scan (repeatable; defaults to the workspace file's own directory)",
    (value: string, previous: string[] | undefined) => [...(previous ?? []), value],
  )
  .action(async (opts: { workspace: string; target: string; root?: string[] }) => {
    const result = await registryRegisterCommand({
      workspace: opts.workspace,
      target: opts.target,
      ...(opts.root !== undefined && { roots: opts.root }),
    });
    process.exit(result.exitCode);
  });

registryProgram
  .command('impact-select')
  .description(
    'Select the consumers impacted by a candidate change to one package within one framework/generation bucket',
  )
  .requiredOption('-r, --registry <path>', 'path to a registry.json produced by `rv registry scan`')
  .requiredOption('-f, --framework <name>', 'candidate\'s framework, e.g. "angular"')
  .requiredOption(
    '-g, --generation <version>',
    "candidate's OWN framework-version bucket — derived from its declared peer dependency, not its own semver ()",
  )
  .requiredOption('-p, --package <name>', 'candidate package name')
  .option('-o, --output <dir>', 'output directory for impact.json', process.cwd())
  .action(
    async (opts: {
      registry: string;
      framework: string;
      generation: string;
      package: string;
      output: string;
    }) => {
      const result = await registryImpactSelectCommand({
        registry: opts.registry,
        framework: opts.framework,
        generation: opts.generation,
        package: opts.package,
        output: opts.output,
      });
      process.exit(result.exitCode);
    },
  );

// ── contract command (parent — shares this namespace) ────────
//
// deliberately simplified — assumes the target playground app is
// ALREADY running at the configured access point; this command never
// builds/serves an app itself (see the story's scope note).

const contractProgram = program.command('contract').description('Component Test Contract tooling');

contractProgram
  .command('generate-anchors')
  .description(
    "Capture a component's real accessibility tree from an already-running playground and merge new anchors into its contract.yaml",
  )
  .requiredOption('-a, --access-points <path>', 'path to access-points.yaml')
  .requiredOption(
    '-c, --component <name>',
    'e.g. "core-controls/rv-multi-select" — must be configured in access-points.yaml',
  )
  .requiredOption(
    '--contract <path>',
    "path to the component's contract.yaml (scaffolded if it doesn't exist yet)",
  )
  .requiredOption(
    '--package <name>',
    'real package name to scaffold with, if contract.yaml does not exist yet',
  )
  .action(
    async (opts: {
      accessPoints: string;
      component: string;
      contract: string;
      package: string;
    }) => {
      const result = await generateAnchorsCommand({
        accessPoints: opts.accessPoints,
        component: opts.component,
        contract: opts.contract,
        package: opts.package,
      });
      process.exit(result.exitCode);
    },
  );

contractProgram
  .command('check-anchors')
  .description(
    "Capture a component's real accessibility tree from an already-running playground and check every required anchor in its contract.yaml, with a detailed, actionable finding for anything missing",
  )
  .requiredOption('-a, --access-points <path>', 'path to access-points.yaml')
  .requiredOption(
    '-c, --component <name>',
    'e.g. "core-controls/rv-multi-select" — must be configured in access-points.yaml',
  )
  .requiredOption('--contract <path>', "path to the component's contract.yaml")
  .action(async (opts: { accessPoints: string; component: string; contract: string }) => {
    const result = await checkAnchorsCommand({
      accessPoints: opts.accessPoints,
      component: opts.component,
      contract: opts.contract,
    });
    process.exit(result.exitCode);
  });

// ── tests command (parent — shares this namespace) ───────────────
//
// The base-test versioning domain (design) — distinct from `contract`
// (the declared anchor surface). `check-lockstep` is the
// "release-pipeline hook (example)" T-8.3.1 asks for: a release script/CI
// step runs this against the version about to be published and blocks on a
// non-zero exit.

const testsProgram = program.command('tests').description('Base-test versioning tooling');

testsProgram
  .command('check-lockstep')
  .description(
    'Check whether a base-test version exists for a component version about to be released (design) — blocking, for use in a release pipeline',
  )
  .requiredOption(
    '-p, --package-name <name>',
    'base-test package name, e.g. "@RippleViewTests/core-controls"',
  )
  .requiredOption(
    '--component-version <version>',
    'the component version about to be released, e.g. "17.2.0" or "18.3.3-beta.1" (named to avoid colliding with the CLI\'s own --version flag)',
  )
  .requiredOption('-r, --registry <url>', 'registry base URL, e.g. http://localhost:4873')
  .action(async (opts: { packageName: string; componentVersion: string; registry: string }) => {
    const result = await checkLockstepCommand({
      packageName: opts.packageName,
      version: opts.componentVersion,
      registry: opts.registry,
    });
    process.exit(result.exitCode);
  });

// ── dashboard command ─────────────────────────────────────────────────────────

program
  .command('dashboard')
  .description('Start the RippleView dashboard web server')
  .option(
    '-i, --input <path>',
    'path to registry.json for initial data (optional — dashboard starts empty if omitted)',
  )
  .option('-p, --port <number>', 'port to listen on', '9999')
  .action(async (opts: { input?: string; port: string }) => {
    const result = await dashboardCommand(opts);
    process.exit(result.exitCode);
  });

// ── stub commands ─────────────────────────────────────────────────────────────

(['crawl', 'scan', 'baseline', 'report', 'init'] as const).forEach((name) => {
  program
    .command(name)
    .description(stubDescriptions[name] ?? `${name} command`)
    .action(() => {
      const result = stubCommand(name);
      process.stderr.write(result.message + '\n');
      process.exit(result.exitCode);
    });
});

// ── Programmatic entry point ──────────────────────────────────────────────────

/**
 * Parse `argv` and dispatch the matching command.
 * Pass `process.argv` for normal CLI use; pass a custom array for tests.
 */
export async function run(argv: string[]): Promise<void> {
  await program.parseAsync(argv);
}
