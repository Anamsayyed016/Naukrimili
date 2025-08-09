// Minimal mock Prisma-like client for non-database environments
type AnyData = Record<string, unknown>;

function createTable() {
  return {
    findUnique: async (_args?: AnyData) => null,
    findMany: async (_args?: AnyData) => [] as AnyData[],
    create: async (args?: AnyData) => args?.data ?? null,
    update: async (args?: AnyData) => args?.data ?? null,
    delete: async (_args?: AnyData) => null,
  };
}

export const prisma = {
  user: createTable(),
  job: createTable(),
  application: createTable(),
  profile: createTable(),
};
