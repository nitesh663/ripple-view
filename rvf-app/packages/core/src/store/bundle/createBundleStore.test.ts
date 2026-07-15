import { describe, it, expect, vi } from 'vitest';
import { createBundleStore } from './createBundleStore.js';
import { LocalZipBundleStore } from './LocalZipBundleStore.js';
import { OciBundleStore } from './OciBundleStore.js';

// AC-2: moving from local-zip (PoC) to OCI (prod) is a config swap — the
// same factory call site produces a different concrete BundleStore.
describe('AC-2: createBundleStore profile switch', () => {
  it('returns a LocalZipBundleStore for profile "local-zip"', () => {
    const store = createBundleStore({
      profile: 'local-zip',
      localZip: { storeDir: '/tmp/bundles' },
    });
    expect(store).toBeInstanceOf(LocalZipBundleStore);
  });

  it('returns an OciBundleStore for profile "oci"', () => {
    const store = createBundleStore({
      profile: 'oci',
      oci: { registry: 'registry.example.com', repository: 'rv-bundles' },
    });
    expect(store).toBeInstanceOf(OciBundleStore);
  });

  it('uses the default storeDir when localZip config is omitted', () => {
    const store = createBundleStore({ profile: 'local-zip' });
    expect(store).toBeInstanceOf(LocalZipBundleStore);
  });

  it('uses default registry/repository when oci config is omitted', () => {
    const store = createBundleStore({ profile: 'oci' });
    expect(store).toBeInstanceOf(OciBundleStore);
  });

  it('wires injected deps through to the OCI profile instead of real fs/executor', async () => {
    const executor = vi.fn().mockReturnValue('');
    const store = createBundleStore(
      { profile: 'oci', oci: { registry: 'r', repository: 'repo' } },
      { executor, ociWorkDir: '/tmp/oci-work' },
    );

    await store.fetchBundle('digest-x', '/tmp/dest');
    expect(executor).toHaveBeenCalledWith('oras', expect.arrayContaining(['pull']));
  });
});
