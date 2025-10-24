import { PrismaClient } from '@prisma/client';
import { NextRequest } from 'next/server';
import { POST, GET } from '@/app/api/auth/set-role/route';

// Test database setup
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
    }
  }
});

// Mock NextAuth for integration tests
jest.mock('@/lib/nextauth-config', () => ({
  auth: jest.fn()
}));

import { auth } from '@/lib/nextauth-config';
const mockAuth = auth as jest.MockedFunction<typeof auth>;

describe('Role Selection Integration Tests (PostgreSQL)', () => {
  let testUserId: string;

  beforeAll(async () => {
    // Clean up any existing test data
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'test-role-selection'
        }
      }
    });
  });

  afterAll(async () => {
    // Clean up test data
    if (testUserId) {
      await prisma.user.delete({
        where: { id: testUserId }
      });
    }
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Create a test user for each test
    const testUser = await prisma.user.create({
      data: {
        email: `test-role-selection-${Date.now()}@example.com`,
        firstName: 'Test',
        lastName: 'User',
        role: null, // No role initially
        roleLocked: false,
        isActive: true,
        isVerified: true
      }
    });
    testUserId = testUser.id;

    // Mock auth to return our test user
    mockAuth.mockResolvedValue({
      user: { id: testUserId, email: testUser.email }
    } as any);
  });

  afterEach(async () => {
    // Clean up the test user
    if (testUserId) {
      await prisma.user.delete({
        where: { id: testUserId }
      });
    }
  });

  describe('POST /api/auth/set-role', () => {
    it('should set jobseeker role and lock it', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/set-role', {
        method: 'POST',
        body: JSON.stringify({ role: 'jobseeker' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user.role).toBe('jobseeker');
      expect(data.user.roleLocked).toBe(true);
      expect(data.user.lockedRole).toBe('jobseeker');

      // Verify in database
      const dbUser = await prisma.user.findUnique({
        where: { id: testUserId }
      });

      expect(dbUser?.role).toBe('jobseeker');
      expect(dbUser?.roleLocked).toBe(true);
      expect(dbUser?.lockedRole).toBe('jobseeker');
    });

    it('should set employer role and lock it', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/set-role', {
        method: 'POST',
        body: JSON.stringify({ role: 'employer' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user.role).toBe('employer');
      expect(data.user.roleLocked).toBe(true);

      // Verify in database
      const dbUser = await prisma.user.findUnique({
        where: { id: testUserId }
      });

      expect(dbUser?.role).toBe('employer');
      expect(dbUser?.roleLocked).toBe(true);
    });

    it('should reject invalid roles', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/set-role', {
        method: 'POST',
        body: JSON.stringify({ role: 'invalid' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid role. Must be "jobseeker" or "employer"');
    });

    it('should prevent role changes after role is locked', async () => {
      // First, set a role
      await prisma.user.update({
        where: { id: testUserId },
        data: {
          role: 'jobseeker',
          roleLocked: true,
          lockedRole: 'jobseeker'
        }
      });

      // Try to change role
      const request = new NextRequest('http://localhost:3000/api/auth/set-role', {
        method: 'POST',
        body: JSON.stringify({ role: 'employer' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Role is locked and cannot be changed');
    });
  });

  describe('GET /api/auth/set-role', () => {
    it('should return user role status when user has no role', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/set-role');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user.role).toBe(null);
      expect(data.needsRoleSelection).toBe(true);
    });

    it('should return user role status when user has a role', async () => {
      // Set a role first
      await prisma.user.update({
        where: { id: testUserId },
        data: {
          role: 'jobseeker',
          roleLocked: true,
          lockedRole: 'jobseeker'
        }
      });

      const request = new NextRequest('http://localhost:3000/api/auth/set-role');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user.role).toBe('jobseeker');
      expect(data.needsRoleSelection).toBe(false);
    });
  });

  describe('Database Constraints', () => {
    it('should enforce role constraints', async () => {
      // This test verifies that the database constraints are working
      // If the migration was applied correctly, this should fail
      try {
        await prisma.user.update({
          where: { id: testUserId },
          data: {
            role: 'invalid_role'
          }
        });
        fail('Should have thrown an error for invalid role');
      } catch (error: any) {
        // Should fail due to CHECK constraint
        expect(error.message).toContain('role_check');
      }
    });

    it('should enforce locked role constraints', async () => {
      try {
        await prisma.user.update({
          where: { id: testUserId },
          data: {
            lockedRole: 'invalid_role'
          }
        });
        fail('Should have thrown an error for invalid locked role');
      } catch (error: any) {
        // Should fail due to CHECK constraint
        expect(error.message).toContain('lockedRole_check');
      }
    });

    it('should enforce role locked consistency', async () => {
      try {
        await prisma.user.update({
          where: { id: testUserId },
          data: {
            roleLocked: true,
            lockedRole: null
          }
        });
        fail('Should have thrown an error for inconsistent role locked state');
      } catch (error: any) {
        // Should fail due to CHECK constraint
        expect(error.message).toContain('roleLocked_consistency_check');
      }
    });
  });
});
