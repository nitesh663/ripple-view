import { describe, it, expect } from 'vitest';
import Fastify from 'fastify';
import type { RegistryDocument } from '@rippleview/registry';
import { registerFleetRoute, buildFleetResponse } from './fleet.js';
import type { FleetResponse } from '../../types.js';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const SINGLE_CHANNEL: RegistryDocument = {
  angular: {
    '17': {
      '@op/core-controls': {
        latest: '17.3.0',
        consumers: { 'admin-app': '17.2.0', 'billing-app': '17.1.0' },
      },
      '@op/data-grid': {
        latest: '17.2.0',
        consumers: { 'admin-app': '17.2.0' },
      },
    },
  },
};

const TWO_CHANNELS: RegistryDocument = {
  angular: {
    '17': {
      '@op/core-controls': { latest: '17.3.0', consumers: { 'admin-app': '17.2.0' } },
    },
    '15': {
      '@op/core-controls': { latest: '15.1.0', consumers: { 'legacy-app': '15.0.0' } },
    },
  },
};

// ── buildFleetResponse unit tests ─────────────────────────────────────────────

describe('buildFleetResponse', () => {
  it('produces one channel for a single-channel registry', () => {
    const result = buildFleetResponse(SINGLE_CHANNEL);
    expect(result.channels).toHaveLength(1);
    expect(result.channels[0]?.framework).toBe('angular');
    expect(result.channels[0]?.generation).toBe('17');
    expect(result.channels[0]?.label).toBe('Angular ng17');
  });

  it('lists libraries in sorted order', () => {
    const result = buildFleetResponse(SINGLE_CHANNEL);
    expect(result.channels[0]?.libraries).toEqual(['@op/core-controls', '@op/data-grid']);
  });

  it('lists all unique consumer apps in sorted order', () => {
    const result = buildFleetResponse(SINGLE_CHANNEL);
    const apps = result.channels[0]?.apps.map((a) => a.appName);
    expect(apps).toEqual(['admin-app', 'billing-app']);
  });

  it('produces a cell for each library per app', () => {
    const result = buildFleetResponse(SINGLE_CHANNEL);
    const adminRow = result.channels[0]?.apps.find((a) => a.appName === 'admin-app');
    expect(adminRow?.cells).toHaveLength(2);
  });

  it('sets consumed=null for an app that does not use a library', () => {
    const result = buildFleetResponse(SINGLE_CHANNEL);
    const billingRow = result.channels[0]?.apps.find((a) => a.appName === 'billing-app');
    const dataGridCell = billingRow?.cells.find((c) => c.library === '@op/data-grid');
    expect(dataGridCell?.consumed).toBeNull();
    expect(dataGridCell?.drift.badge).toBe('none');
  });

  it('computes correct drift badges', () => {
    const result = buildFleetResponse(SINGLE_CHANNEL);
    const adminRow = result.channels[0]?.apps.find((a) => a.appName === 'admin-app');
    const coreCell = adminRow?.cells.find((c) => c.library === '@op/core-controls');
    expect(coreCell?.drift.badge).toBe('minor');
    expect(coreCell?.drift.minorsBehind).toBe(1);

    const dataGridCell = adminRow?.cells.find((c) => c.library === '@op/data-grid');
    expect(dataGridCell?.drift.badge).toBe('current');
  });

  it('produces two channels for a two-channel registry', () => {
    const result = buildFleetResponse(TWO_CHANNELS);
    expect(result.channels).toHaveLength(2);
    const generations = result.channels.map((c) => c.generation).sort();
    expect(generations).toEqual(['15', '17']);
  });

  it('keeps channels isolated — ng15 app does not appear in ng17 channel', () => {
    const result = buildFleetResponse(TWO_CHANNELS);
    const ng17 = result.channels.find((c) => c.generation === '17');
    expect(ng17?.apps.map((a) => a.appName)).not.toContain('legacy-app');
  });
});

// ── HTTP endpoint tests ───────────────────────────────────────────────────────

describe('GET /api/fleet', () => {
  it('returns 200 with valid FleetResponse for a populated registry', async () => {
    const fastify = Fastify();
    registerFleetRoute(fastify, () => SINGLE_CHANNEL);
    await fastify.ready();

    const res = await fastify.inject({ method: 'GET', url: '/api/fleet' });
    expect(res.statusCode).toBe(200);

    const body = res.json<FleetResponse>();
    expect(body.channels).toHaveLength(1);
    expect(body.channels[0]?.libraries).toContain('@op/core-controls');

    await fastify.close();
  });

  it('returns 200 with empty channels for an empty registry', async () => {
    const fastify = Fastify();
    registerFleetRoute(fastify, () => ({}));
    await fastify.ready();

    const res = await fastify.inject({ method: 'GET', url: '/api/fleet' });
    expect(res.statusCode).toBe(200);
    expect(res.json<FleetResponse>().channels).toEqual([]);

    await fastify.close();
  });
});
