// createBundleStore.ts — factory selecting a BundleStore implementation from
// config.profile. This is what makes AC-2's "config swap, no consumer change"
// claim literally true: every call site uses createBundleStore(config) and
// never references LocalZipBundleStore / OciBundleStore directly.

import { execFileSync } from 'node:child_process';
import AdmZip from 'adm-zip';
import type { BundleStoreConfig, BundleStore } from './types.js';
import { LocalZipBundleStore, type BundleFsMod, type ZipExtractor } from './LocalZipBundleStore.js';
import { OciBundleStore, type Executor } from './OciBundleStore.js';

const DEFAULT_LOCAL_ZIP_DIR = '.rv/bundles';

/** Real `oras` executor — throws on non-zero exit via execFileSync. */
const realExecutor: Executor = (command, args) =>
  execFileSync(command, args, { stdio: 'pipe', encoding: 'utf8' });

/** Real zip extractor backed by the `adm-zip` package. */
const realZipExtractor: ZipExtractor = {
  extractAll: (archive, destDir) => {
    new AdmZip(archive).extractAllTo(destDir, true);
  },
};

export interface CreateBundleStoreDeps {
  /** Injected for LocalZipBundleStore tests; real fs by default. */
  fs?: BundleFsMod;
  /** Injected zip extractor; real adm-zip by default. */
  zip?: ZipExtractor;
  /** Injected process executor for the OCI profile; real execFileSync by default. */
  executor?: Executor;
  /** Working directory the OCI profile uses to stage archives before push/pull. */
  ociWorkDir?: string;
}

/**
 * Build the BundleStore for the configured profile.
 *
 * G11: this factory is the only place that switches on `profile` — adding a
 * new backend means adding a new case here and a new implementation class,
 * never forking the BundleStore SPI consumers.
 */
export function createBundleStore(
  config: BundleStoreConfig,
  deps: CreateBundleStoreDeps = {},
): BundleStore {
  if (config.profile === 'oci') {
    const oci = config.oci ?? {};
    return new OciBundleStore(
      oci.registry ?? 'localhost:5000',
      oci.repository ?? 'rv-bundles',
      deps.executor ?? realExecutor,
      deps.ociWorkDir ?? process.cwd(),
    );
  }

  const storeDir = config.localZip?.storeDir ?? DEFAULT_LOCAL_ZIP_DIR;
  return new LocalZipBundleStore(storeDir, deps.zip ?? realZipExtractor, deps.fs);
}
