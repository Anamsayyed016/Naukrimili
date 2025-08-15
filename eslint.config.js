module.exports = {
  extends: [
    'next/core-web-vitals',
    '@typescript-eslint/recommended'
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-empty-function': 'warn',
    'no-empty': 'warn',
    'no-unreachable': 'error',
    '@typescript-eslint/no-unreachable': 'error'
  },
  ignorePatterns: [
    'dist/*',
    '.next/*',
    'node_modules/*',
    'lib/generated/*',
    '**/*.generated.*',
    '**/*.d.ts',
    'prisma/*'
  ]
};
