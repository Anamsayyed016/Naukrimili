// Integration test setup for PostgreSQL tests
import '@testing-library/jest-dom'

// Set test environment variables
process.env.NODE_ENV = 'test'
process.env.TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL

// Mock NextAuth for integration tests
jest.mock('@/lib/nextauth-config', () => ({
  auth: jest.fn()
}))

// Global test timeout for database operations
jest.setTimeout(30000)

// Clean up after all tests
afterAll(async () => {
  // Close any open database connections
  const { PrismaClient } = require('@prisma/client')
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
      }
    }
  })
  
  try {
    await prisma.$disconnect()
  } catch (error) {
    console.warn('Error disconnecting from test database:', error)
  }
})
