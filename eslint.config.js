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
  {
    extends: ['next/core-web-vitals'],
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-explicit-any': 'warn',
      'no-empty': 'warn',
    },
  },
];
