import { PrismaClient } from "@prisma/client";

describe("Sample Test Suite", () => {
  let prisma: any;

  beforeAll(() => {
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should pass a basic test", () => {
    expect(2 + 2).toBe(4);
  });

  it("should mock Prisma client correctly", async () => {
    const mockUser = { id: 1, name: "Test User" };
    prisma.user.findUnique.mockResolvedValue(mockUser);

    const result = await prisma.user.findUnique({
      where: { id: 1 }
    });

    expect(result).toEqual(mockUser);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 1 }
    });
  });
});
