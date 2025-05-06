import {
  CommandInteraction,
  ContainerBuilder,
  SectionBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
} from "discord.js";
import { err, ok } from "neverthrow";
import { afterEach, beforeEach, describe, expect, it, Mock, vi } from "vitest";
import { IUserRepository } from "../types/interfaces.js";
import { LeaderboardCommand } from "./leaderboard.js";

class MockUserRepository implements IUserRepository {
  trackMessage = vi.fn();
  getUserStats = vi.fn();
  getTopUsers = vi.fn();
  getGuildHourlyActivity = vi.fn();
  getUserHourlyActivity = vi.fn();
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
  let mockClient: {
    on: Mock;
    login: Mock;
    rest: { put: Mock };
    user: { id: string };
    users: { fetch: Mock };
  };

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
        { userId: "1", count: 100 },
        { userId: "2", count: 90 },
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
      expect(mockUserRepository.getTopUsers).toHaveBeenCalledWith("321");
    });
  });

  describe("integration", () => {
    it("should format the embed with proper data for each user", async () => {
      const mockInteraction = createMockInteraction();
      const mockUsers = [
        { userId: "1", count: 100 },
        { id: "2", count: 90 },
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
                  "` #1 ` User - **100** messages" +
                  "\n` #2 ` User - **90** messages",
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
      const mockUsers = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((index) => ({
        userId: index.toString(),
        count: index,
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
                  "`  #1 ` User - **10** messages" +
                  "\n`  #2 ` User - **9** messages" +
                  "\n`  #3 ` User - **8** messages" +
                  "\n`  #4 ` User - **7** messages" +
                  "\n`  #5 ` User - **6** messages" +
                  "\n`  #6 ` User - **5** messages" +
                  "\n`  #7 ` User - **4** messages" +
                  "\n`  #8 ` User - **3** messages" +
                  "\n`  #9 ` User - **2** messages" +
                  "\n` #10 ` User - **1** message",
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
