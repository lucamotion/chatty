import { beforeEach, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "../generated/prisma/index.js";
import { IPrismaClientProvider } from "../types/interfaces.js";
import { UserRepository } from "./user-repository.js";

const mockPrismaClient = {
  user: {
    upsert: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
  },
  activityBucket: {
    aggregate: vi.fn(),
    groupBy: vi.fn(),
    findFirst: vi.fn(),
  },
};

describe("UserRepository", () => {
  let userRepository: UserRepository;

  beforeEach(() => {
    const prismaMock: IPrismaClientProvider = {
      getClient: () => mockPrismaClient as unknown as PrismaClient,
    };

    userRepository = new UserRepository(prismaMock);
    vi.clearAllMocks();
  });

  it("should call findFirst with corect parameters in getUserStats", async () => {
    const mockDate = new Date();
    const mockUser = { count: 123, lastSeen: mockDate };

    mockPrismaClient.activityBucket.findFirst.mockResolvedValue({
      updatedAt: mockDate,
    });
    mockPrismaClient.activityBucket.aggregate.mockResolvedValue({
      _sum: { counter: 123 },
    });

    const result = await userRepository.getUserStats("123", "1");

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual(mockUser);
  });

  it("should call findMany with correct parameters in getTopUsers", async () => {
    const mockUsers = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((index) => ({
      userId: index.toString(),
      count: index,
    }));

    mockPrismaClient.activityBucket.groupBy.mockResolvedValue(
      mockUsers.map(({ userId, count }) => ({
        _sum: { counter: count },
        userId,
      })),
    );

    const result = await userRepository.getTopUsers("123");

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual(mockUsers);
    expect(mockPrismaClient.activityBucket.groupBy).toHaveBeenCalledWith({
      where: { guildId: "123" },
      by: ["userId"],
      _sum: { counter: true },
      orderBy: { _sum: { counter: "desc" } },
    });
  });
});
