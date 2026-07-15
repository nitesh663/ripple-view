import type { StepPattern } from '../types.js';

// Assertion patterns

const assertVisible: StepPattern = {
  pattern: /^the (?<role>\S+) "(?<name>[^"]+)" is visible$/,
  action: 'assert-visible',
  extractParams(match) {
    return { role: match.groups?.['role'] ?? '', name: match.groups?.['name'] ?? '' };
  },
};

// T-3.3.4 (): ordinal-qualified visibility assertion, e.g.
// `the 2nd dropdown "Country" is visible`. Reuses the existing
// 'assert-visible' action — disambiguation is carried entirely in params.
const assertVisibleOrdinal: StepPattern = {
  pattern: /^the (?<ordinal>\d+)(?:st|nd|rd|th) (?<role>\S+) "(?<name>[^"]+)" is visible$/,
  action: 'assert-visible',
  extractParams(match) {
    return {
      role: match.groups?.['role'] ?? '',
      name: match.groups?.['name'] ?? '',
      index: Number(match.groups?.['ordinal'] ?? '0'),
    };
  },
};

const assertEnabled: StepPattern = {
  pattern: /^the (?<role>\S+) "(?<name>[^"]+)" is enabled$/,
  action: 'assert-enabled',
  extractParams(match) {
    return { role: match.groups?.['role'] ?? '', name: match.groups?.['name'] ?? '' };
  },
};

const assertDisabled: StepPattern = {
  pattern: /^the (?<role>\S+) "(?<name>[^"]+)" is disabled$/,
  action: 'assert-disabled',
  extractParams(match) {
    return { role: match.groups?.['role'] ?? '', name: match.groups?.['name'] ?? '' };
  },
};

const assertText: StepPattern = {
  pattern: /^the text "(?<value>[^"]+)" is shown$/,
  action: 'assert-text',
  extractParams(match) {
    return { value: match.groups?.['value'] ?? '' };
  },
};

const assertSelection: StepPattern = {
  pattern: /^the selection equals "(?<value>[^"]+)"$/,
  action: 'assert-selection',
  extractParams(match) {
    return { value: match.groups?.['value'] ?? '' };
  },
};

const assertCount: StepPattern = {
  pattern: /^the (?<role>\S+) count equals (?<count>\d+)$/,
  action: 'assert-count',
  extractParams(match) {
    return {
      role: match.groups?.['role'] ?? '',
      count: Number(match.groups?.['count'] ?? '0'),
    };
  },
};

const assertNoOverlap: StepPattern = {
  pattern: /^"(?<a>[^"]+)" does not overlap "(?<b>[^"]+)"$/,
  action: 'assert-no-overlap',
  extractParams(match) {
    return { a: match.groups?.['a'] ?? '', b: match.groups?.['b'] ?? '' };
  },
};

const assertInViewport: StepPattern = {
  pattern: /^the "(?<name>[^"]+)" is within the viewport$/,
  action: 'assert-in-viewport',
  extractParams(match) {
    return { name: match.groups?.['name'] ?? '' };
  },
};

const assertAttribute: StepPattern = {
  pattern:
    /^the attribute "(?<attr>[^"]+)" of (?<role>\S+) "(?<name>[^"]+)" equals "(?<value>[^"]+)"$/,
  action: 'assert-attribute',
  extractParams(match) {
    return {
      attr: match.groups?.['attr'] ?? '',
      role: match.groups?.['role'] ?? '',
      name: match.groups?.['name'] ?? '',
      value: match.groups?.['value'] ?? '',
    };
  },
};

const assertUrl: StepPattern = {
  pattern: /^the URL is "(?<route>[^"]+)"$/,
  action: 'assert-url',
  extractParams(match) {
    return { route: match.groups?.['route'] ?? '' };
  },
};

export const assertionPatterns: StepPattern[] = [
  assertVisible,
  assertVisibleOrdinal,
  assertEnabled,
  assertDisabled,
  assertText,
  assertSelection,
  assertCount,
  assertNoOverlap,
  assertInViewport,
  assertAttribute,
  assertUrl,
];
