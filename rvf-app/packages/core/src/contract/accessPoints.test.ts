import { describe, it, expect } from 'vitest';
import { parseAccessPointsConfig, findAccessPoint, AccessPointsError } from './accessPoints.js';

describe('parseAccessPointsConfig — T-8.4.1: access-points config schema', () => {
  it('parses a valid access-points.yaml', () => {
    const yaml = `
accessPoints:
  - component: core-controls/rv-multi-select
    url: http://localhost:4200/multi-select
  - component: data-grid
    url: http://localhost:4200/data-grid
`;
    const config = parseAccessPointsConfig(yaml);
    expect(config.accessPoints).toHaveLength(2);
    expect(config.accessPoints[0]).toEqual({
      component: 'core-controls/rv-multi-select',
      url: 'http://localhost:4200/multi-select',
    });
  });

  it('defaults to an empty list when accessPoints is omitted', () => {
    const config = parseAccessPointsConfig('version: "1"\n');
    expect(config.accessPoints).toEqual([]);
  });

  it('throws AccessPointsError when an entry is missing a required field', () => {
    const yaml = `
accessPoints:
  - component: core-controls/rv-button
`;
    expect(() => parseAccessPointsConfig(yaml)).toThrow(AccessPointsError);
  });
});

describe('findAccessPoint', () => {
  it('finds the configured entry for a component', () => {
    const config = parseAccessPointsConfig(`
accessPoints:
  - component: core-controls/rv-button
    url: http://localhost:4200/button
  - component: core-controls/rv-input
    url: http://localhost:4200/input
`);
    expect(findAccessPoint(config, 'core-controls/rv-input')).toEqual({
      component: 'core-controls/rv-input',
      url: 'http://localhost:4200/input',
    });
  });

  it('returns undefined for an unconfigured component (never throws)', () => {
    const config = parseAccessPointsConfig('accessPoints: []\n');
    expect(findAccessPoint(config, 'unknown/component')).toBeUndefined();
  });
});
