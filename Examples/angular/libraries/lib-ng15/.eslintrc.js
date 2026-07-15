/**
 * Root ESLint config for the @op UI-library workspace.
 * Per-project .eslintrc.json files extend this and re-assert selector prefixes.
 */
module.exports = {
  root: true,
  ignorePatterns: ['projects/**/*', 'dist/**/*'],
  overrides: [
    {
      files: ['*.ts'],
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@angular-eslint/recommended',
        'plugin:@angular-eslint/template/process-inline-templates',
      ],
      rules: {
        // Control components use the op-cc- prefix; directives use op.
        '@angular-eslint/component-selector': [
          'error',
          { type: 'element', prefix: 'op', style: 'kebab-case' },
        ],
        '@angular-eslint/directive-selector': [
          'error',
          { type: 'attribute', prefix: 'op', style: 'camelCase' },
        ],
        // One class per file.
        'max-classes-per-file': ['error', 1],
        // Interfaces are PascalCase (no I-prefix by convention; the
        // explicitly-named public ISelectItem is the single sanctioned exception).
        '@typescript-eslint/naming-convention': [
          'warn',
          { selector: 'interface', format: ['PascalCase'] },
        ],
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-empty-function': 'off',
        '@typescript-eslint/no-unused-vars': [
          'error',
          { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
        ],
      },
    },
    {
      files: ['*.html'],
      extends: [
        'plugin:@angular-eslint/template/recommended',
      ],
      rules: {},
    },
  ],
};
