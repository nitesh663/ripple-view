// BundleManifest — describes one content-addressed consumer-app bundle.
// G5: same shape across local-zip (PoC) and OCI (prod) profiles —
//     field names are a contract, never rename to fit a backend.
export interface BundleManifest {
  appName: string;
  /** sha256 of the archive bytes, hex-encoded */
  digest: string;
  /** ISO 8601 */
  createdAt: string;
  sizeBytes: number;
}

/**
 * Stores and retrieves content-addressed consumer-app bundles ().
 *
 * Push-not-pull: a consumer's own CI runs `rv bundle` and pushes the
 * resulting archive here. RippleView never clones a consumer repo and never
 * holds SCM credentials — only whatever credentials this store itself
 * needs (e.g. registry-pull creds for an OCI profile).
 *
 * G11: implement this interface to add a new store backend; never fork core.
 * G5: BundleManifest field names are identical across every implementation.
 */
export interface BundleStore {
  /** Persist `archive` (already built by createBundle) under `appName`. */
  putBundle(appName: string, archive: Buffer, manifest: BundleManifest): Promise<void>;
  /** Most recently pushed bundle's manifest for `appName`, or undefined if none exists. */
  getLatestBundle(appName: string): Promise<BundleManifest | undefined>;
  /** Extract the bundle identified by `digest` into `destDir`. */
  fetchBundle(digest: string, destDir: string): Promise<void>;
}

// BundleStoreConfig — parsed from WorkspaceConfigSchema's `bundleStore` block.
// AC-2: moving from local-zip (PoC) to OCI (prod) is a config swap — the
// `profile` discriminant is the only thing a consumer-facing call site reads.
export interface BundleStoreConfig {
  profile: 'local-zip' | 'oci';
  localZip?: { storeDir: string };
  oci?: { registry?: string; repository?: string };
}
