import { navigationPatterns } from './navigation.js';
import { dataPatterns } from './data.js';
import { actionPatterns } from './actions.js';
import { assertionPatterns } from './assertions.js';
import { networkPatterns } from './network.js';
import { dialogPatterns } from './dialog.js';
import type { StepPattern } from '../types.js';

export const ALL_CATALOG_PATTERNS: readonly StepPattern[] = [
  ...navigationPatterns,
  ...dataPatterns,
  ...actionPatterns,
  ...assertionPatterns,
  ...networkPatterns,
  ...dialogPatterns,
];
