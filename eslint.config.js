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
      'build/*'
    ]
  },
  {
    extends: ['next/core-web-vitals'],
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-empty-function': 'warn',
      'no-empty': 'warn',
      'no-unreachable': 'error'
    }
  }
];
