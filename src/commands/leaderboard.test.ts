import {
  CommandInteraction,
  ContainerBuilder,
  SectionBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
} from "discord.js";
import { err, ok } from "neverthrow";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { IUserRepository } from "../types/interfaces.js";
import { LeaderboardCommand } from "./leaderboard.js";

class MockUserRepository implements IUserRepository {
  trackMessage = vi.fn();
  getUserStats = vi.fn();
  getTopUsers = vi.fn();
}

const createMockInteraction = () => {
  const mockInteraction = {
    reply: vi.fn().mockResolvedValue(undefined),
    user: {
      id: "123",
      username: "user",
    },
    guild: {
      id: "321",
      name: "guild",
      iconURL: vi.fn().mockReturnValue("https://image.com/image.jpeg"),
    },
  } as unknown as CommandInteraction;

  return mockInteraction;
};

describe("LeaderboardCommand", () => {
  let leaderboardCommand: LeaderboardCommand;
  let mockUserRepository: MockUserRepository;

  beforeEach(() => {
    mockUserRepository = new MockUserRepository();
    leaderboardCommand = new LeaderboardCommand(mockUserRepository);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("execute", () => {
    it("should reply with message when no users are found", async () => {
      const mockInteraction = createMockInteraction();
      mockUserRepository.getTopUsers.mockResolvedValue(ok([]));

      const result = await leaderboardCommand.execute(mockInteraction);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap().components).toEqual([
        new ContainerBuilder().addSectionComponents(
          new SectionBuilder()
            .addTextDisplayComponents(
              new TextDisplayBuilder({
                content: "## Top chatters in guild",
              }),
              new TextDisplayBuilder({
                content: "We haven't recorded any messages in **guild** yet!",
              }),
            )
            .setThumbnailAccessory(
              new ThumbnailBuilder().setURL("https://image.com/image.jpeg"),
            ),
        ),
      ]);
    });

    it("should create components with user data when users are found", async () => {
      const mockInteraction = createMockInteraction();
      const mockUsers = [
        {
          id: "1",
          username: "User1",
          messages: 100,
          commands: 50,
          lastSeen: new Date(),
        },
        {
          id: "2",
          username: "User2",
          messages: 90,
          commands: 40,
          lastSeen: new Date(),
        },
      ];
      mockUserRepository.getTopUsers.mockResolvedValue(ok(mockUsers));

      const result = await leaderboardCommand.execute(mockInteraction);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toHaveProperty("components");
    });

    it("should return error when getTopUsers fails", async () => {
      const mockInteraction = createMockInteraction();
      mockUserRepository.getTopUsers = vi.fn().mockResolvedValue(err());

      const result = await leaderboardCommand.execute(mockInteraction);

      expect(result.isErr()).toBe(true);
      expect(mockUserRepository.getTopUsers).toHaveBeenCalledWith("321", 10);
    });
  });

  describe("integration", () => {
    it("should format the embed with proper data for each user", async () => {
      const mockInteraction = createMockInteraction();
      const mockDate = new Date("2023-01-01T12:00:00Z");
      const mockUsers = [
        {
          id: "1",
          username: "User1",
          messages: 100,
          commands: 50,
          lastSeen: mockDate,
        },
        {
          id: "2",
          username: "User2",
          messages: 90,
          commands: 40,
          lastSeen: mockDate,
        },
      ];
      mockUserRepository.getTopUsers.mockResolvedValue(ok(mockUsers));

      const result = await leaderboardCommand.execute(mockInteraction);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap().components).toEqual([
        new ContainerBuilder().addSectionComponents(
          new SectionBuilder()
            .addTextDisplayComponents(
              new TextDisplayBuilder({
                content: "## Top chatters in guild",
              }),
              new TextDisplayBuilder({
                content:
                  "` #1 ` User1 - **100** messages" +
                  "\n` #2 ` User2 - **90** messages",
              }),
            )
            .setThumbnailAccessory(
              new ThumbnailBuilder().setURL("https://image.com/image.jpeg"),
            ),
        ),
      ]);
    });

    it("should pad correctly with 10+ users", async () => {
      const mockInteraction = createMockInteraction();
      const mockDate = new Date("2023-01-01T12:00:00Z");
      const mockUsers = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((index) => ({
        id: index.toString(),
        username: `User${index}`,
        messages: index,
        lastSeen: mockDate,
      }));
      mockUserRepository.getTopUsers.mockResolvedValue(ok(mockUsers));

      const result = await leaderboardCommand.execute(mockInteraction);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap().components).toEqual([
        new ContainerBuilder().addSectionComponents(
          new SectionBuilder()
            .addTextDisplayComponents(
              new TextDisplayBuilder({
                content: "## Top chatters in guild",
              }),
              new TextDisplayBuilder({
                content:
                  "`  #1 ` User10 - **10** messages" +
                  "\n`  #2 ` User9 - **9** messages" +
                  "\n`  #3 ` User8 - **8** messages" +
                  "\n`  #4 ` User7 - **7** messages" +
                  "\n`  #5 ` User6 - **6** messages" +
                  "\n`  #6 ` User5 - **5** messages" +
                  "\n`  #7 ` User4 - **4** messages" +
                  "\n`  #8 ` User3 - **3** messages" +
                  "\n`  #9 ` User2 - **2** messages" +
                  "\n` #10 ` User1 - **1** message",
              }),
            )
            .setThumbnailAccessory(
              new ThumbnailBuilder().setURL("https://image.com/image.jpeg"),
            ),
        ),
      ]);
    });
  });
});
