import type { StepPattern } from '../types.js';

// Network patterns ( AC2) — assert against real captured HTTP
// exchanges via the NetworkCapture SPI, never a synthetic in-memory object.

const assertApiCalled: StepPattern = {
  pattern: /^an API call is made to "(?<urlPattern>[^"]+)"$/,
  action: 'assert-api-called',
  extractParams(match) {
    return { urlPattern: match.groups?.['urlPattern'] ?? '' };
  },
};

const assertApiStatus: StepPattern = {
  pattern: /^the API response status for "(?<urlPattern>[^"]+)" is (?<status>\d+)$/,
  action: 'assert-api-status',
  extractParams(match) {
    return {
      urlPattern: match.groups?.['urlPattern'] ?? '',
      status: Number(match.groups?.['status'] ?? '0'),
    };
  },
};

const assertApiBodyContains: StepPattern = {
  pattern: /^the request body for "(?<urlPattern>[^"]+)" contains "(?<value>[^"]+)"$/,
  action: 'assert-api-body-contains',
  extractParams(match) {
    return {
      urlPattern: match.groups?.['urlPattern'] ?? '',
      value: match.groups?.['value'] ?? '',
    };
  },
};

export const networkPatterns: StepPattern[] = [
  assertApiCalled,
  assertApiStatus,
  assertApiBodyContains,
];
