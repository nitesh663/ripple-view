import type { Page } from 'playwright';

// ── Shared local types for the executor family files ───────────────────────
// Mirrors the exact narrowing seam already established in
// PlaywrightLocatorStrategy.ts: the core SPI keeps `role: string` so
// @rippleview/core never imports Playwright (G1); `getByRole`'s real signature
// pins `role` to a literal ARIA-role union, so callers cast through this
// alias at the one deliberate seam where SPI looseness meets Playwright's
// stricter real API (type-level cast only, never `any`).
export type AriaRole = Parameters<Page['getByRole']>[0];
