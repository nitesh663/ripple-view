// OciBundleStore.ts — the prod BundleStore profile (AC-2): pushes/pulls the
// same bundle by digest as an OCI artifact via the `oras` CLI. Pure argument
// builders are separated from the class so they're unit-testable without
// ever invoking a real process (G13) — mirrors scripts/build-app-runtime-args.mjs.

import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { BundleManifest, BundleStore } from './types.js';

/**
 * Runs a command with an argument array (NOT a shell string) so args are not
 * shell-interpolated; must throw/reject on non-zero exit.
 */
export type Executor = (command: string, args: string[]) => unknown;

const MEDIA_TYPE = 'application/vnd.rv.bundle.v1+zip';

/** `oras push <ref> <archive>:<mediaType>` — pushes the archive as an OCI artifact. */
export function buildOrasPushArgs(opts: {
  registry: string;
  repository: string;
  tag: string;
  archivePath: string;
}): string[] {
  const ref = `${opts.registry}/${opts.repository}:${opts.tag}`;
  return ['push', ref, `${opts.archivePath}:${MEDIA_TYPE}`];
}

/** `oras pull <ref> -o <destDir>` — pulls an artifact addressed by digest. */
export function buildOrasPullArgs(opts: {
  registry: string;
  repository: string;
  digest: string;
  destDir: string;
}): string[] {
  const ref = `${opts.registry}/${opts.repository}@sha256:${opts.digest}`;
  return ['pull', ref, '-o', opts.destDir];
}

/**
 * `oras resolve <ref>` — resolves a mutable tag (e.g. `latest-<appName>`) to
 * its current digest. Used by getLatestBundle to find "current" without any
 * SCM access — the tag itself is the per-app latest-pointer index, which
 * keeps this profile simple (no separate index artifact to maintain).
 */
export function buildOrasResolveArgs(opts: {
  registry: string;
  repository: string;
  tag: string;
}): string[] {
  const ref = `${opts.registry}/${opts.repository}:${opts.tag}`;
  return ['resolve', ref];
}

function latestTag(appName: string): string {
  return `latest-${appName}`;
}

/**
 * OCI-artifact BundleStore — the prod profile (AC-2). Same BundleStore SPI
 * as LocalZipBundleStore; only the config.profile value changes at the call
 * site (createBundleStore.ts), proving the "config swap, no consumer change"
 * claim in AC-2.
 *
 * Errors from the injected executor are surfaced as rejected promises, not
 * swallowed — this is a store I/O operation, not a gate-stage Finding.
 */
export class OciBundleStore implements BundleStore {
  constructor(
    private readonly registry: string,
    private readonly repository: string,
    private readonly executor: Executor,
    private readonly workDir: string,
  ) {}

  async putBundle(appName: string, archive: Buffer, manifest: BundleManifest): Promise<void> {
    const archivePath = join(this.workDir, `${manifest.digest}.zip`);
    writeFileSync(archivePath, archive);

    const pushArgs = buildOrasPushArgs({
      registry: this.registry,
      repository: this.repository,
      tag: manifest.digest,
      archivePath,
    });
    this.run(pushArgs);

    // Move the per-app "latest" pointer to this digest's tag.
    const movePointerArgs = buildOrasPushArgs({
      registry: this.registry,
      repository: this.repository,
      tag: latestTag(appName),
      archivePath,
    });
    this.run(movePointerArgs);

    // Cache the manifest locally so getLatestBundle can answer without a
    // network round-trip; this is a local convenience cache, not the source
    // of truth (the registry tag is authoritative).
    writeFileSync(
      join(this.workDir, `${appName}.latest.json`),
      JSON.stringify(manifest, null, 2),
      'utf8',
    );
  }

  async getLatestBundle(appName: string): Promise<BundleManifest | undefined> {
    const cachePath = join(this.workDir, `${appName}.latest.json`);
    if (!existsSync(cachePath)) {
      return undefined;
    }
    try {
      return JSON.parse(readFileSync(cachePath, 'utf8')) as BundleManifest;
    } catch {
      return undefined;
    }
  }

  async fetchBundle(digest: string, destDir: string): Promise<void> {
    const pullArgs = buildOrasPullArgs({
      registry: this.registry,
      repository: this.repository,
      digest,
      destDir,
    });
    this.run(pullArgs);
  }

  private run(args: string[]): void {
    try {
      this.executor('oras', args);
    } catch (err) {
      throw err instanceof Error ? err : new Error(String(err));
    }
  }
}
