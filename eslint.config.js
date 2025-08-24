import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  baseDirectory: process.cwd(),
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
  ...compat.extends("next/core-web-vitals"),
  {
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-empty': 'warn',
    },
  },
];
