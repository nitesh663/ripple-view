/**
 * publish-fixture-variant.mjs — publishes every git-tagged version of one
 * ng15-line Angular CLI library project to a registry.
 *
 * Each project's 15.0.0/15.1.0/15.2.0 states are git TAGS on a single
 * evolving source tree, not parallel directories — this script materializes
 * each tag in an isolated git worktree (never touching the main working
 * tree), builds it with `ng build`, and publishes the result. `shared`
 * (a real npm dependency of core-controls, not just a tsconfig path hack)
 * is built first inside the same worktree so the path mapping resolves
 * during the build — dist/ is gitignored, so it never exists in a fresh
 * worktree checkout on its own.
 *
 * Usage:
 *   node scripts/publish-fixture-variant.mjs \
 *     --workspace angular/libraries/lib-ng15 \
 *     --project core-controls \
 *     --tags core-controls-v15.0.0,core-controls-v15.1.0,core-controls-v15.2.0 \
 *     --registry http://localhost:4873 \
 *     --build-first shared
 */

import { execFileSync } from 'node:child_process';
import { mkdtempSync, cpSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(fileURLToPath(import.meta.url), '..', '..');

function run(command, args, cwd) {
  console.log(`$ ${command} ${args.join(' ')}${cwd ? `  (cwd: ${cwd})` : ''}`);
  execFileSync(command, args, { cwd, stdio: 'inherit' });
}

function parseArgs(argv) {
  const flags = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      flags[arg.slice(2)] = argv[i + 1];
      i += 1;
    }
  }
  if (!flags['workspace'] || !flags['project'] || !flags['tags'] || !flags['registry']) {
    throw new Error(
      'Usage: publish-fixture-variant.mjs --workspace <relPath> --project <name> --tags <tag1,tag2,...> --registry <url> [--build-first <project>]',
    );
  }
  return {
    workspace: flags['workspace'],
    project: flags['project'],
    tags: flags['tags'].split(','),
    registry: flags['registry'],
    buildFirst: flags['build-first'] ? flags['build-first'].split(',') : [],
  };
}

function publishVariants({ workspace, project, tags, registry, buildFirst }) {
  const worktreeDir = mkdtempSync(join(tmpdir(), 'rv-fixture-publish-'));
  const mainWorkspaceDir = join(repoRoot, workspace);
  const worktreeWorkspaceDir = join(worktreeDir, workspace);

  try {
    run('git', ['worktree', 'add', '--detach', worktreeDir, tags[0]], repoRoot);
    // Same devDependencies at every tag of this workspace — copy once
    // rather than reinstalling from the registry on every variant.
    cpSync(join(mainWorkspaceDir, 'node_modules'), join(worktreeWorkspaceDir, 'node_modules'), {
      recursive: true,
    });

    for (const tag of tags) {
      console.log(`\n=== ${workspace}/${project} @ ${tag} ===`);
      run('git', ['checkout', tag], worktreeDir);
      // dist/ is gitignored, so any dependency this project resolves via a
      // local tsconfig path mapping (e.g. core-controls -> shared) must be
      // rebuilt fresh in this worktree before the project itself builds.
      for (const dep of buildFirst) {
        run('npx', ['ng', 'build', dep], worktreeWorkspaceDir);
      }
      run('npx', ['ng', 'build', project], worktreeWorkspaceDir);
      run('npm', ['publish', '--registry', registry], join(worktreeWorkspaceDir, 'dist', project));
    }
  } finally {
    run('git', ['worktree', 'remove', '--force', worktreeDir], repoRoot);
    rmSync(worktreeDir, { recursive: true, force: true });
  }
}

const thisFile = fileURLToPath(import.meta.url);
if (thisFile === process.argv[1]) {
  publishVariants(parseArgs(process.argv.slice(2)));
}
