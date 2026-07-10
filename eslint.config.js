import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import globals from 'globals';

export default [
  { ignores: ['dist/**', 'node_modules/**', '.claude/**', 'public/**'] },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,mjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, ...globals.node }
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y
    },
    settings: { react: { version: 'detect' } },
    rules: {
      // jsx-runtime (not the full `recommended` config) since this project
      // uses the automatic JSX runtime and doesn't use prop-types —
      // react/recommended's prop-types requirement doesn't fit here. Still
      // need jsx-uses-vars explicitly, though — without it, no-unused-vars
      // can't tell that e.g. <RootLayout /> counts as using the RootLayout
      // import, and flags every JSX-only import as unused.
      ...react.configs['jsx-runtime'].rules,
      'react/jsx-uses-vars': 'error',
      ...jsxA11y.configs.recommended.rules,
      // The stable pair, not react-hooks' newer "recommended" additions
      // (set-state-in-effect, refs) — those flag several long-standing,
      // intentional patterns in this codebase as errors and are out of
      // scope for an accessibility-linting pass.
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }]
    }
  },
  {
    files: ['**/*.test.{js,jsx}', 'vitest.setup.js'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node, ...globals.vitest }
    }
  }
];
