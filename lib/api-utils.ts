import type { NextRequest } from 'next/server';
import { auth } from '@/lib/nextauth-config';


export interface AuthenticatedRequest extends NextRequest {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role: 'jobseeker' | 'employer' | 'recruiter' | 'admin';
    profileCompletion?: number;
  };
}

// Authenticate API Request (server)
export async function authenticateApiRequest(): Promise<{ user: AuthenticatedRequest['user'] } | null> {
  const session: any = await auth();
  if (!session || !session.user) return null;
  return {
    user: {
      id: (session.user as any).id,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
      role: ((session.user as any).role || 'jobseeker') as any,
      profileCompletion: (session.user as any).profileCompletion,
    },
  };
}

export function hasRole(userRole: string, requiredRoles: string[]): boolean {
  return requiredRoles.includes(userRole);
}

export function errorResponse(message: string, status: number = 400) {
  return Response.json({ error: message, success: false }, { status });
}

export function successResponse(data: Record<string, unknown>, message?: string) {
  return Response.json({ success: true, ...(message ? { message } : {}), ...data });
}

export function validatePagination(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
  return { page, limit };
}

export function getPaginationMetadata(totalCount: number, page: number, limit: number) {
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));
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
    endIndex: Math.min(page * limit - 1, Math.max(0, totalCount - 1)),
  };
}
