import { describe, it, expect } from 'vitest';
import { detectFramework, majorVersionOf } from './detectFramework.js';

describe('majorVersionOf', () => {
  it('extracts the leading integer from common semver range prefixes', () => {
    expect(majorVersionOf('^17.3.12')).toBe('17');
    expect(majorVersionOf('~0.14.4')).toBe('0');
    expect(majorVersionOf('17.0.0')).toBe('17');
    expect(majorVersionOf('>=15.2.0')).toBe('15');
  });

  it('returns null when no integer is present', () => {
    expect(majorVersionOf('latest')).toBeNull();
    expect(majorVersionOf('')).toBeNull();
  });
});

describe('detectFramework', () => {
  it('detects angular from @angular/core', () => {
    const result = detectFramework({ '@angular/core': '^17.3.12', rxjs: '~7.8.0' });
    expect(result).toEqual({ framework: 'angular', version: '17' });
  });

  it('detects react from react', () => {
    const result = detectFramework({ react: '^19.2.7', 'react-dom': '^19.2.7' });
    expect(result).toEqual({ framework: 'react', version: '19' });
  });

  it('returns null when no known framework marker is present', () => {
    expect(detectFramework({ lodash: '^4.17.0' })).toBeNull();
    expect(detectFramework({})).toBeNull();
  });

  it('prefers angular over react when (implausibly) both markers are present', () => {
    const result = detectFramework({ '@angular/core': '^17.0.0', react: '^19.0.0' });
    expect(result?.framework).toBe('angular');
  });
});
