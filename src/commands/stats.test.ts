import {
  CommandInteraction,
  ContainerBuilder,
  SectionBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
  time,
  TimestampStyles,
} from "discord.js";
import { err, ok } from "neverthrow";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { IUserRepository } from "../types/interfaces.js";
import { StatsCommand } from "./stats.js";

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
      displayAvatarURL: vi.fn().mockReturnValue("https://image.com/image.jpeg"),
    },
    guild: {
      id: "321",
      name: "guild",
      iconURL: vi.fn().mockReturnValue("https://image.com/image.jpeg"),
    },
    options: {
      get: vi.fn().mockReturnValue(undefined),
    },
  } as unknown as CommandInteraction;

  return mockInteraction;
};

const createMockInteractionWithOption = () => {
  const mockInteraction = {
    reply: vi.fn().mockResolvedValue(undefined),
    user: {
      id: "123",
      username: "user",
      displayAvatarURL: vi.fn().mockReturnValue("https://image.com/image.jpeg"),
    },
    guild: {
      id: "321",
      name: "guild",
      iconURL: vi.fn().mockReturnValue("https://image.com/image.jpeg"),
    },
    options: {
      get: vi.fn().mockReturnValue({
        user: {
          id: "987",
          username: "user2",
          displayAvatarURL: vi
            .fn()
            .mockReturnValue("https://image.com/image.jpeg"),
        },
      }),
    },
  } as unknown as CommandInteraction;

  return mockInteraction;
};

describe("StatsCommand", () => {
  let statsCommand: StatsCommand;
  let mockUserRepository: MockUserRepository;

  beforeEach(() => {
    mockUserRepository = new MockUserRepository();
    statsCommand = new StatsCommand(mockUserRepository);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("execute", () => {
    it("should fetch author's stats when no user is specified", async () => {
      const mockInteraction = createMockInteraction();
      mockUserRepository.getUserStats = vi.fn().mockResolvedValue(ok());

      const result = await statsCommand.execute(mockInteraction);

      expect(result.isOk()).toBe(true);
      expect(mockUserRepository.getUserStats).toHaveBeenCalledWith(
        "123",
        "321",
      );
    });

    it("should fetch target's stats when user is specified", async () => {
      const mockInteraction = createMockInteractionWithOption();
      mockUserRepository.getUserStats = vi.fn().mockResolvedValue(ok());

      const result = await statsCommand.execute(mockInteraction);

      expect(result.isOk()).toBe(true);
      expect(mockUserRepository.getUserStats).toHaveBeenCalledWith(
        "987",
        "321",
      );
    });

    it("should return error when getUserStats fails", async () => {
      const mockInteraction = createMockInteractionWithOption();
      mockUserRepository.getUserStats = vi.fn().mockResolvedValue(err());

      const result = await statsCommand.execute(mockInteraction);

      expect(result.isErr()).toBe(true);
      expect(mockUserRepository.getUserStats).toHaveBeenCalledWith(
        "987",
        "321",
      );
    });
  });

  describe("integration", () => {
    it("should return components when user is not found", async () => {
      const mockInteraction = createMockInteraction();

      mockUserRepository.getUserStats.mockResolvedValue(ok(undefined));
      const result = await statsCommand.execute(mockInteraction);

      expect(result.isOk()).toBe(true);
      expect(mockUserRepository.getUserStats).toHaveBeenCalledWith(
        "123",
        "321",
      );
      expect(result._unsafeUnwrap()).toEqual({
        components: [
          new ContainerBuilder().addSectionComponents(
            new SectionBuilder()
              .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`## **Stats for user**`),
              )
              .setThumbnailAccessory(
                new ThumbnailBuilder().setURL("https://image.com/image.jpeg"),
              )
              .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                  "No messages recorded yet.",
                ),
              ),
          ),
        ],
      });
    });

    it("should return components when user is found", async () => {
      const mockInteraction = createMockInteraction();
      const mockDate = new Date("2023-01-01T12:00:00Z");
      const mockUser = { count: 100, lastSeen: mockDate };

      mockUserRepository.getUserStats.mockResolvedValue(ok(mockUser));
      const result = await statsCommand.execute(mockInteraction);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual({
        components: [
          new ContainerBuilder().addSectionComponents(
            new SectionBuilder()
              .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`## **Stats for user**`),
              )
              .setThumbnailAccessory(
                new ThumbnailBuilder().setURL("https://image.com/image.jpeg"),
              )
              .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                  `**100** messages in \`guild\`` +
                    `\nLast seen **${time(mockDate, TimestampStyles.RelativeTime)}**`,
                ),
              ),
          ),
        ],
      });
    });

    it("should format correctly when only one message", async () => {
      const mockInteraction = createMockInteraction();
      const mockDate = new Date("2023-01-01T12:00:00Z");
      const mockUser = { count: 1, lastSeen: mockDate };

      mockUserRepository.getUserStats.mockResolvedValue(ok(mockUser));
      const result = await statsCommand.execute(mockInteraction);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual({
        components: [
          new ContainerBuilder().addSectionComponents(
            new SectionBuilder()
              .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`## **Stats for user**`),
              )
              .setThumbnailAccessory(
                new ThumbnailBuilder().setURL("https://image.com/image.jpeg"),
              )
              .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                  `**1** message in \`guild\`` +
                    `\nLast seen **${time(mockDate, TimestampStyles.RelativeTime)}**`,
                ),
              ),
          ),
        ],
      });
    });
  });
});
