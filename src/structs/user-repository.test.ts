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

  it("should call upsert with correct parameters in trackMessage", async () => {
    const mockUser = {
      id: "1",
      username: "user1",
      guildId: "123",
      guildName: "guild",
    };

    mockPrismaClient.user.upsert.mockResolvedValue(mockUser);

    const result = await userRepository.trackMessage(
      "1",
      "user1",
      "123",
      "guild",
    );

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual(mockUser);
    expect(mockPrismaClient.user.upsert).toHaveBeenCalledWith({
      where: { id_guildId: { id: "1", guildId: "123" } },
      update: {
        username: "user1",
        messages: { increment: 1 },
        lastSeen: expect.any(Date),
      },
      create: {
        id: "1",
        username: "user1",
        guildId: "123",
        guildName: "guild",
        messages: 1,
      },
    });
  });

  it("should call findFirst with corect parameters in getUserStats", async () => {
    const mockUser = {
      id: "1",
      username: "user1",
      guildId: "123",
      guildName: "guild",
      messages: 1,
      position: 1,
    };

    mockPrismaClient.user.findFirst.mockResolvedValue(mockUser);
    mockPrismaClient.user.count.mockResolvedValue(0);

    const result = await userRepository.getUserStats("1", "123");

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual(mockUser);
    expect(mockPrismaClient.user.findFirst).toHaveBeenCalledWith({
      where: { id: "1", guildId: "123" },
    });
  });

  it("should call findMany with correct parameters in getTopUsers", async () => {
    const mockUsers = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((index) => ({
      id: index.toString(),
      username: `user${index}`,
      guildId: "123",
      guildName: "guild",
      messages: index,
    }));

    mockPrismaClient.user.findMany.mockResolvedValue(mockUsers);

    const result = await userRepository.getTopUsers("123", 10);

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual(mockUsers);
    expect(mockPrismaClient.user.findMany).toHaveBeenCalledWith({
      where: { guildId: "123" },
      orderBy: { messages: "desc" },
      take: 10,
    });
  });
});
