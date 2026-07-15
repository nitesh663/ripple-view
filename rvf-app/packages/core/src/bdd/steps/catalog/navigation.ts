import type { StepPattern } from '../types.js';

// Navigation patterns

// "I am on route "/home""
const navigate: StepPattern = {
  pattern: /^I am on route "(?<route>[^"]+)"$/,
  action: 'navigate',
  extractParams(match) {
    return { route: match.groups?.['route'] ?? '' };
  },
};

// "within the "main-nav" region"
const scopeRegion: StepPattern = {
  pattern: /^within the "(?<region>[^"]+)" region$/,
  action: 'scope-region',
  extractParams(match) {
    return { region: match.groups?.['region'] ?? '' };
  },
};

// "a button is mounted"
const assertMounted: StepPattern = {
  pattern: /^a (?<component>\S+) is mounted$/,
  action: 'assert-mounted',
  extractParams(match) {
    return { component: match.groups?.['component'] ?? '' };
  },
};

export const navigationPatterns: StepPattern[] = [navigate, scopeRegion, assertMounted];
