import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  testMatch: [
    '**/__tests__/**/*.(js|jsx|ts|tsx)',
    '**/*.(test|spec).(js|jsx|ts|tsx)'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/backups/'],
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  testEnvironmentOptions: {
    customExportConditions: [''],
  },
  // Separate test environments for unit and integration tests
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/tests/**/*.test.{js,ts,tsx}'],
      testPathIgnorePatterns: ['/node_modules/', '<rootDir>/backups/', 'integration\\.test\\.(js|ts|tsx)$'],
      setupFilesAfterEnv: [],
      testEnvironment: 'node',
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
      },
      transform: {
        '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
      },
      transformIgnorePatterns: [
        '/node_modules/(?!(uuid)/)',
        '^.+\\.module\\.(css|sass|scss)$',
      ],
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/tests/**/*-integration.test.{js,ts}'],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.integration.js'],
      testEnvironment: 'node',
    }
  ]
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(customJestConfig)
