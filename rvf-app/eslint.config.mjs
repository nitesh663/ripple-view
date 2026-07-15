import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['**/node_modules/**', '**/dist/**', '**/fixtures/any-violation.fixture.ts'] },
  js.configs.recommended,
  {
    files: ['**/*.mjs', '**/*.cjs', '**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ['**/*.ts', '**/*.mts'],
    extends: [...tseslint.configs.strict, ...tseslint.configs.stylistic],
  },
);
