const js = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const prettierConfig = require('eslint-config-prettier');
const nextPlugin = require('@next/eslint-plugin-next');
const pluginImport = require('eslint-plugin-import');
const pluginReact = require('eslint-plugin-react');
const globals = require('globals');
const tseslint = require('typescript-eslint');

const tsconfigRootDir = __dirname;
const browserGlobals = globals.browser;
const nodeGlobals = globals.node;

module.exports = defineConfig([
  js.configs.recommended,
  prettierConfig,
  {
    ignores: [
      '**/node_modules/**',
      '**/.turbo/**',
      '**/.next/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/README.md',
      '**/next-env.d.ts',
      '**/eslint.config.js',
    ],
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    plugins: { import: pluginImport },
    languageOptions: {
      globals: browserGlobals,
    },
    rules: {
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', ['parent', 'sibling'], 'index'],
          pathGroups: [
            { pattern: 'react', group: 'builtin', position: 'before' },
            { pattern: 'next/**', group: 'builtin', position: 'before' },
            { pattern: '@aics/**', group: 'external', position: 'after' },
            { pattern: '~/shared/**', group: 'external', position: 'after' },
            { pattern: '~/entities/**', group: 'external', position: 'after' },
            { pattern: '~/features/**', group: 'external', position: 'after' },
            { pattern: '~/widgets/**', group: 'external', position: 'after' },
            { pattern: '~/course/**', group: 'external', position: 'after' },
          ],
          alphabetize: { order: 'asc', caseInsensitive: true },
          'newlines-between': 'always',
        },
      ],
    },
  },
  {
    files: [
      '**/*.config.{js,cjs,mjs,ts,mts,cts}',
      '.agent/scripts/**/*.{js,mjs}',
    ],
    languageOptions: { globals: nodeGlobals },
  },
  tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    plugins: { '@next/next': nextPlugin },
    settings: { react: { version: '19.0' } },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      '@next/next/no-html-link-for-pages': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/no-unescaped-entities': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  {
    files: ['**/*.{ts,mts,cts,tsx}'],
    languageOptions: { parserOptions: { tsconfigRootDir } },
  },
]);
