import { z } from 'zod';

// ── Component Test Contract schema (contract.yaml) ─────────────────────────
// Mirrors RippleView_SPECS.md exactly. The contract is the declared semantic
// surface a library component publishes — anchors, states, public API, and
// seed-data shape — so that base tests, coverage, and the a11y/structure
// gate all have a single, versioned reference (US-8.1).

export const ContractComponentSchema = z.object({
  name: z.string(),
  package: z.string(),
  primaryRole: z.string(),
  description: z.string(),
});

export const ContractAnchorSchema = z.object({
  id: z.string(),
  role: z.string(),
  /** accessible name — a literal string or a regex pattern (e.g. "Sort *") */
  name: z.string(),
  required: z.boolean(),
  description: z.string(),
});

export const ContractStateReachSchema = z.object({
  /** role-based probe id, or null if the default probe applies */
  probe: z.string().nullable(),
  preconditions: z.array(z.string()).default([]),
});

export const ContractStateSchema = z.object({
  id: z.string(),
  description: z.string(),
  reach: ContractStateReachSchema.optional(),
});

export const ContractApiInputSchema = z.object({
  name: z.string(),
  type: z.string(),
  required: z.boolean(),
  description: z.string(),
});

export const ContractApiOutputSchema = z.object({
  name: z.string(),
  payload: z.string(),
  description: z.string(),
});

export const ContractApiSlotSchema = z.object({
  name: z.string(),
  description: z.string(),
});

export const ContractApiSchema = z.object({
  inputs: z.array(ContractApiInputSchema).default([]),
  outputs: z.array(ContractApiOutputSchema).default([]),
  slots: z.array(ContractApiSlotSchema).default([]),
});

export const ContractDataSchema = z.object({
  /** JSON-schema-like description of the required fixture shape */
  shape: z.record(z.string(), z.unknown()),
  example: z.record(z.string(), z.unknown()),
});

export const ContractA11ySchema = z.object({
  requiredRoles: z.array(z.string()).default([]),
  requiredLabels: z.array(z.string()).default([]),
  wcagLevel: z.enum(['A', 'AA', 'AAA']),
});

export const ContractSchema = z.object({
  component: ContractComponentSchema,
  anchors: z.array(ContractAnchorSchema).default([]),
  states: z.array(ContractStateSchema).default([]),
  api: ContractApiSchema.default({}),
  data: ContractDataSchema,
  probes: z.array(z.string()).default([]),
  a11y: ContractA11ySchema,
});

export type ContractComponent = z.infer<typeof ContractComponentSchema>;
export type ContractAnchor = z.infer<typeof ContractAnchorSchema>;
export type ContractState = z.infer<typeof ContractStateSchema>;
export type ContractApiInput = z.infer<typeof ContractApiInputSchema>;
export type ContractApiOutput = z.infer<typeof ContractApiOutputSchema>;
export type ContractApiSlot = z.infer<typeof ContractApiSlotSchema>;
export type ContractApi = z.infer<typeof ContractApiSchema>;
export type ContractData = z.infer<typeof ContractDataSchema>;
export type ContractA11y = z.infer<typeof ContractA11ySchema>;
export type Contract = z.infer<typeof ContractSchema>;
