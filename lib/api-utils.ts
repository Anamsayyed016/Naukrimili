import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

export interface AuthenticatedRequest extends NextRequest {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role: 'jobseeker' | 'employer' | 'recruiter' | 'admin';
    profileCompletion: number;
  };
}

/**
 * Middleware to authenticate API requests
 * Returns the user session or throws an error
 */
export async function authenticateApiRequest(): Promise<{
  user: AuthenticatedRequest['user'];
} | null> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return null;
    }

    return {
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        role: session.user.role,
        profileCompletion: session.user.profileCompletion
      }
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

/**
 * Check if user has required role
 */
export function hasRole(userRole: string, requiredRoles: string[]): boolean {
  return requiredRoles.includes(userRole);
}

/**
 * Format error response
 */
export function errorResponse(message: string, status: number = 400) {
  return Response.json(
    { error: message, success: false },
    { status }
  );
}

/**
 * Format success response
 */
export function successResponse(data: Record<string, unknown>, message?: string) {
  return Response.json({
    success: true,
    ...(message && { message }),
    ...data
  });
}

/**
 * Validate pagination parameters
 */
export function validatePagination(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')));
  
  return { page, limit };
}

/**
 * Calculate pagination metadata
 */
export function getPaginationMetadata(
  totalCount: number,
  page: number,
  limit: number
) {
  const totalPages = Math.ceil(totalCount / limit);
  const hasMore = page < totalPages;
  const hasPrevious = page > 1;
  
  return {
    page,
    limit,
    totalCount,
    totalPages,
    hasMore,
    hasPrevious,
    startIndex: (page - 1) * limit,
    endIndex: Math.min(page * limit - 1, totalCount - 1)
  };
}
