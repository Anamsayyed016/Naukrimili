import { NextRequest } from 'next/server';
import { POST, GET } from '@/app/api/auth/set-role/route';
import { auth } from '@/lib/nextauth-config';
import { prisma } from '@/lib/prisma';

// Mock dependencies
jest.mock('@/lib/nextauth-config');
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('/api/auth/set-role', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST', () => {
    it('should set role for authenticated user', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
      } as any);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        role: null,
        roleLocked: false,
        lockedRole: null,
      } as any);

      mockPrisma.user.update.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        role: 'jobseeker',
        roleLocked: true,
        lockedRole: 'jobseeker',
        roleLockReason: 'Role locked as jobseeker after OAuth signup',
      } as any);

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
    });

    it('should reject unauthenticated requests', async () => {
      mockAuth.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/auth/set-role', {
        method: 'POST',
        body: JSON.stringify({ role: 'jobseeker' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Authentication required');
    });

    it('should reject invalid roles', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
      } as any);

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

    it('should reject role changes for locked users', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
      } as any);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        role: 'employer',
        roleLocked: true,
        lockedRole: 'employer',
      } as any);

      const request = new NextRequest('http://localhost:3000/api/auth/set-role', {
        method: 'POST',
        body: JSON.stringify({ role: 'jobseeker' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Role is locked and cannot be changed');
    });

    it('should reject role changes for users with existing roles', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
      } as any);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        role: 'employer',
        roleLocked: false,
        lockedRole: null,
      } as any);

      const request = new NextRequest('http://localhost:3000/api/auth/set-role', {
        method: 'POST',
        body: JSON.stringify({ role: 'jobseeker' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Role already set and cannot be changed');
    });
  });

  describe('GET', () => {
    it('should return user role status', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
      } as any);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        role: 'jobseeker',
        roleLocked: true,
        lockedRole: 'jobseeker',
        roleLockReason: 'Role locked as jobseeker after OAuth signup',
      } as any);

      const request = new NextRequest('http://localhost:3000/api/auth/set-role');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user.role).toBe('jobseeker');
      expect(data.needsRoleSelection).toBe(false);
    });

    it('should indicate when role selection is needed', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
      } as any);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        role: null,
        roleLocked: false,
        lockedRole: null,
        roleLockReason: null,
      } as any);

      const request = new NextRequest('http://localhost:3000/api/auth/set-role');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user.role).toBe(null);
      expect(data.needsRoleSelection).toBe(true);
    });
  });
});
