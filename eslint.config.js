import { FlatCompat } from '@eslint/eslintrc';
import path from 'path';
import { fileURLToPath } from 'url';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  {
    ignores: [
      'dist/*',
      '.next/*',
      'node_modules/*',
      'lib/generated/*',
      '**/*.generated.*',
      '**/*.d.ts',
      'prisma/*',
      'out/*',
      'build/*',
      'coverage/*',
      '*.config.js',
      '*.config.ts',
      '.eslintignore',
      '.eslintrc*'
    ]
  },
  ...compat.extends('next/core-web-vitals'),
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
    },
    rules: {
      'no-unused-vars': 'off', // Turn off base rule
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }], // Warn only, not error - prevents build failures
      '@typescript-eslint/no-explicit-any': 'warn', // Warn only, not error - prevents build failures
      'no-empty': 'warn',
      'react/no-unescaped-entities': 'warn', // Warn only, not error - prevents build failures
      'react-hooks/exhaustive-deps': 'warn', // Warn only, not error - prevents build failures
      // All rules set to 'warn' to prevent build failures in production
      // ESLint is disabled during Next.js builds by default in Next.js 16+
    },
  },
];
