import js from '@eslint/js';
import jsdoc from 'eslint-plugin-jsdoc';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';

export default [
  { ignores: ['build/', '.svelte-kit/', '.wrangler/', 'node_modules/'] },
  js.configs.recommended,
  jsdoc.configs['flat/recommended'],
  ...svelte.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^_', argsIgnorePattern: '^_' }],
      // Types come from JSDoc and are checked by svelte-check; descriptions stay optional.
      'jsdoc/require-param-description': 'off',
      'jsdoc/require-returns-description': 'off',
      'jsdoc/require-property-description': 'off',
    },
  },
];
