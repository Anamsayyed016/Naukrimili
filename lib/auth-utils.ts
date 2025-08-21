import { getServerSession } from "next-auth";
import { authOptions } from "./nextauth-config";
import { prisma } from "./prisma";

export interface AuthUser {
  id: number;
  email: string;
  name?: string;
  role: string;
}

export interface CompanyUser extends AuthUser {
  company: {
    id: number;
    name: string;
    description?: string;
    logo?: string;
    website?: string;
    location?: string;
    industry?: string;
    size?: string;
    founded?: number;
    isVerified: boolean;
  };
}

/**
 * Get authenticated user session with proper type conversion
 */
export async function getAuthenticatedUser(): Promise<AuthUser | null> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return null;
    }

    // Convert string ID to number
    const userId = parseInt(session.user.id as string, 10);
    if (isNaN(userId)) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });

    return user;
  } catch (error) {
    console.error('Error getting authenticated user:', error);
    return null;
  }
}

/**
 * Get authenticated employer user with company information
 */
export async function getAuthenticatedEmployer(): Promise<CompanyUser | null> {
  try {
    const user = await getAuthenticatedUser();
    if (!user || user.role !== "employer") {
      return null;
    }

    const employerWithCompany = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        createdCompanies: {
          select: {
            id: true,
            name: true,
            description: true,
            logo: true,
            website: true,
            location: true,
            industry: true,
            size: true,
            founded: true,
            isVerified: true
          }
        }
      }
    });

    if (!employerWithCompany || !employerWithCompany.createdCompanies.length) {
      return null;
    }

    return {
      ...user,
      company: employerWithCompany.createdCompanies[0]
    };
  } catch (error) {
    console.error('Error getting authenticated employer:', error);
    return null;
  }
}

/**
 * Require authentication and return user or error
 */
export async function requireAuth(): Promise<{ user: AuthUser } | { error: string; status: number }> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return { error: "Unauthorized", status: 401 };
  }
  return { user };
}

/**
 * Require employer authentication and return user with company or error
 */
export async function requireEmployerAuth(): Promise<{ user: CompanyUser } | { error: string; status: number }> {
  const user = await getAuthenticatedEmployer();
  if (!user) {
    return { error: "Access denied. Employer account required.", status: 403 };
  }
  return { user };
}

/**
 * Require admin authentication
 */
export async function requireAdminAuth(): Promise<{ user: AuthUser } | { error: string; status: number }> {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== "admin") {
    return { error: "Access denied. Admin account required.", status: 403 };
  }
  return { user };
}
