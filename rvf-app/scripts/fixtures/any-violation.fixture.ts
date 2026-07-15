// This file intentionally contains TypeScript `any` violations for ESLint testing (AC2).
// DO NOT add eslint-disable comments — the test relies on ESLint failing here.
export function broken(x: any): any {
  return x;
}
