import { describe, it, expect, vi } from 'vitest';
import { RegistryStore } from './RegistryStore.js';
import type { RegistryDocument } from '@rippleview/registry';

const DOC_A: RegistryDocument = {
  angular: {
    '17': {
      '@op/core-controls': { latest: '17.3.0', consumers: { 'admin-app': '17.2.0' } },
    },
  },
};

const DOC_B: RegistryDocument = {
  angular: {
    '15': {
      '@op/core-controls': { latest: '15.2.0', consumers: { 'orders-app': '15.2.0' } },
    },
  },
  react: {
    '19': {
      '@op/react-core-controls': { latest: '19.2.0', consumers: { 'settings-app': '19.0.0' } },
    },
  },
};

describe('RegistryStore', () => {
  it('starts empty', () => {
    const store = new RegistryStore();
    expect(store.isEmpty()).toBe(true);
    expect(store.get()).toEqual({});
  });

  it('merge() adds data and marks non-empty', () => {
    const store = new RegistryStore();
    store.merge(DOC_A);
    expect(store.isEmpty()).toBe(false);
    expect(store.get().angular?.['17']?.['@op/core-controls']?.latest).toBe('17.3.0');
  });

  it('merge() deep-merges without wiping existing channels', () => {
    const store = new RegistryStore();
    store.merge(DOC_A);
    store.merge(DOC_B);
    const doc = store.get();
    // A's angular/17 still present
    expect(doc.angular?.['17']?.['@op/core-controls']?.latest).toBe('17.3.0');
    // B's angular/15 added
    expect(doc.angular?.['15']?.['@op/core-controls']?.latest).toBe('15.2.0');
    // B's react/19 added
    expect(doc.react?.['19']?.['@op/react-core-controls']?.latest).toBe('19.2.0');
  });

  it('merge() updates an existing package entry', () => {
    const store = new RegistryStore();
    store.merge(DOC_A);
    store.merge({
      angular: {
        '17': { '@op/core-controls': { latest: '17.4.0', consumers: { 'admin-app': '17.3.0' } } },
      },
    });
    expect(store.get().angular?.['17']?.['@op/core-controls']?.latest).toBe('17.4.0');
  });

  it('merge() emits "updated"', () => {
    const store = new RegistryStore();
    const listener = vi.fn();
    store.on('updated', listener);
    store.merge(DOC_A);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  // Scenario 2 merge correctness — library and consumer app register separately

  it('merge() keeps non-empty latest when consumer registers before library', () => {
    const store = new RegistryStore();
    // Consumer arrives first (latest = '' because library not in scan roots)
    store.merge({
      angular: {
        '17': { '@op/core-controls': { latest: '', consumers: { 'orders-app': '17.2.0' } } },
      },
    });
    // Library registers later — provides the real latest
    store.merge({
      angular: { '17': { '@op/core-controls': { latest: '17.3.0', consumers: {} } } },
    });
    const entry = store.get().angular?.['17']?.['@op/core-controls'];
    expect(entry?.latest).toBe('17.3.0');
    expect(entry?.consumers['orders-app']).toBe('17.2.0');
  });

  it('merge() keeps consumers when library registers before consumer', () => {
    const store = new RegistryStore();
    // Library arrives first
    store.merge({
      angular: { '17': { '@op/core-controls': { latest: '17.3.0', consumers: {} } } },
    });
    // Consumer app registers later
    store.merge({
      angular: {
        '17': { '@op/core-controls': { latest: '', consumers: { 'billing-app': '17.1.0' } } },
      },
    });
    const entry = store.get().angular?.['17']?.['@op/core-controls'];
    expect(entry?.latest).toBe('17.3.0');
    expect(entry?.consumers['billing-app']).toBe('17.1.0');
  });

  it('merge() accumulates multiple independent consumer registrations', () => {
    const store = new RegistryStore();
    store.merge({
      angular: { '17': { '@op/core-controls': { latest: '17.3.0', consumers: {} } } },
    });
    store.merge({
      angular: {
        '17': { '@op/core-controls': { latest: '', consumers: { 'orders-app': '17.2.0' } } },
      },
    });
    store.merge({
      angular: {
        '17': { '@op/core-controls': { latest: '', consumers: { 'billing-app': '17.1.0' } } },
      },
    });
    store.merge({
      angular: {
        '17': { '@op/core-controls': { latest: '', consumers: { 'admin-app': '17.3.0' } } },
      },
    });
    const entry = store.get().angular?.['17']?.['@op/core-controls'];
    expect(entry?.latest).toBe('17.3.0');
    expect(Object.keys(entry?.consumers ?? {})).toHaveLength(3);
    expect(entry?.consumers['orders-app']).toBe('17.2.0');
    expect(entry?.consumers['billing-app']).toBe('17.1.0');
    expect(entry?.consumers['admin-app']).toBe('17.3.0');
  });

  it('reset() clears the store and emits "updated"', () => {
    const store = new RegistryStore();
    store.merge(DOC_A);
    const listener = vi.fn();
    store.on('updated', listener);
    store.reset();
    expect(store.isEmpty()).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
