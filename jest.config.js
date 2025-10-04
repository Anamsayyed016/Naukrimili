import nextJest from 'next/jest'

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
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
  },
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
      testPathIgnorePatterns: ['<rootDir>/tests/**/*-integration.test.{js,ts}'],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
      testEnvironment: 'jsdom',
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
