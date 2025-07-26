// Mock Prisma client for deployment
export const prisma = {
  // Mock tables
  user: {
    findUnique: async () => null,
    findMany: async () => [],
    create: async (data: any) => data,
    update: async (data: any) => data,
    delete: async () => null,
  },
  job: {
    findUnique: async () => null,
    findMany: async () => [],
    create: async (data: any) => data,
    update: async (data: any) => data,
    delete: async () => null,
  },
  application: {
    findUnique: async () => null,
    findMany: async () => [],
    create: async (data: any) => data,
    update: async (data: any) => data,
    delete: async () => null,
  },
  profile: {
    findUnique: async () => null,
    findMany: async () => [],
    create: async (data: any) => data,
    update: async (data: any) => data,
    delete: async () => null,
  }
};
