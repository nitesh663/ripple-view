import type { StepPattern } from '../types.js';

// Data patterns

// "a grid with at least 5 rows"
const seedGrid: StepPattern = {
  pattern: /^a grid with at least (?<count>\d+) rows$/,
  action: 'seed-data',
  extractParams(match) {
    return { kind: 'grid', count: Number(match.groups?.['count'] ?? '0') };
  },
};

// "seeded data users"
const seedRef: StepPattern = {
  pattern: /^seeded data (?<ref>\S+)$/,
  action: 'seed-data',
  extractParams(match) {
    return { kind: 'ref', ref: match.groups?.['ref'] ?? '' };
  },
};

export const dataPatterns: StepPattern[] = [seedGrid, seedRef];
