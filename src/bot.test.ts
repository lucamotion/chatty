import {
  ChatInputCommandInteraction,
  Client,
  Interaction,
  InteractionReplyOptions,
  Message,
  Routes,
  SlashCommandBuilder,
} from "discord.js";
import { err, ok } from "neverthrow";
import { beforeEach, describe, expect, it, Mock, vi } from "vitest";
import { Bot } from "./bot.js";
import { ChattyError } from "./structs/error.js";
import { IBot, ICommand, IUserRepository } from "./types/interfaces.js";

class MockUserRepository implements IUserRepository {
  trackMessage = vi.fn();
  getUserStats = vi.fn();
  getTopUsers = vi.fn();
  getGuildHourlyActivity = vi.fn();
  getUserHourlyActivity = vi.fn();
}

describe("Bot", () => {
  let mockUserRepository: IUserRepository;
  let mockCommand: ICommand;
  let mockCommands: Array<ICommand>;
  let mockClient: {
    on: Mock;
    login: Mock;
    rest: { put: Mock };
    user: { id: string };
  };
  let bot: IBot;
  let token: string;

  beforeEach(() => {
    mockUserRepository = new MockUserRepository();
    mockClient = {
      on: vi.fn(),
      login: vi.fn(),
      rest: { put: vi.fn() },
      user: { id: "123" },
    };
    token = "token";

    mockCommand = {
      data: {
        name: "test",
        toJSON: vi.fn().mockReturnValue("fakejson"),
      } as unknown as SlashCommandBuilder,
      execute: vi.fn(),
    };

    mockCommands = [mockCommand];

    bot = new Bot(
      mockClient as unknown as Client,
      token,
      mockCommands,
      mockUserRepository,
    );
  });

  describe("start", () => {
    it("should connect to Discord gateway", async () => {
      const loginSpy = vi.spyOn(mockClient, "login");

      await bot.start();

      expect(loginSpy).toHaveBeenCalledWith(token);
    });

    it("should write global application commands", async () => {
      const commandPutSpy = vi.spyOn(mockClient.rest, "put");

      await bot.start();

      expect(commandPutSpy).toHaveBeenCalledWith(
        Routes.applicationCommands("123"),
        { body: ["fakejson"] },
      );
    });
  });

  describe("messageCreate", () => {
    it("should not track bot messages", async () => {
      const message = { author: { bot: true } } as unknown as Message;

      const trackMessageSpy = vi.spyOn(mockUserRepository, "trackMessage");

      await bot.onMessageCreate(message);

      expect(trackMessageSpy).toHaveBeenCalledTimes(0);
    });

    it("should not track messages in DMs", async () => {
      const message = {
        author: { bot: false },
        guild: null,
      } as unknown as Message;

      const trackMessageSpy = vi.spyOn(mockUserRepository, "trackMessage");

      await bot.onMessageCreate(message);

      expect(trackMessageSpy).toHaveBeenCalledTimes(0);
    });

    it("should call trackMessage on messageCreate event", async () => {
      const message = {
        author: { id: "123", username: "user", bot: false },
        guild: { id: "456", name: "guild" },
        channel: { id: "789" },
      } as unknown as Message;
      const onSpy = vi.spyOn(mockUserRepository, "trackMessage");

      await bot.onMessageCreate(message);

      expect(onSpy).toHaveBeenCalledWith("123", "456", "789");
    });
  });

  describe("interactionCreate", () => {
    it("should ignore non-command interactions", async () => {
      const interaction = {
        isChatInputCommand: vi.fn().mockReturnValue(false),
      } as unknown as Interaction;
      const executeSpy = vi.spyOn(mockCommand, "execute");

      await bot.onInteractionCreate(interaction);

      expect(executeSpy).toHaveBeenCalledTimes(0);
    });

    it("should ignore invalid commands", async () => {
      const interaction = {
        isChatInputCommand: vi.fn().mockReturnValue(true),
        commandName: "badcommand",
      } as unknown as Interaction;
      const executeSpy = vi.spyOn(mockCommand, "execute");

      await bot.onInteractionCreate(interaction);

      expect(executeSpy).toHaveBeenCalledTimes(0);
    });

    it("should execute valid commands", async () => {
      const interaction = {
        isChatInputCommand: vi.fn().mockReturnValue(true),
        commandName: "test",
        reply: vi.fn(),
      } as unknown as ChatInputCommandInteraction;
      mockCommand.execute = vi.fn().mockResolvedValue(ok({ components: [] }));
      const executeSpy = vi.spyOn(mockCommand, "execute");
      const replySpy = vi.spyOn(interaction, "reply");

      await bot.onInteractionCreate(interaction);

      expect(replySpy).toHaveBeenCalled();
      expect(executeSpy).toHaveBeenCalledWith(interaction);
    });

    it("should safely handle unexpected errors", async () => {
      const interaction = {
        isChatInputCommand: vi.fn().mockReturnValue(true),
        commandName: "test",
        reply: vi.fn(),
      } as unknown as ChatInputCommandInteraction;
      mockCommand.execute = vi
        .fn()
        .mockResolvedValue(err(new ChattyError("foo")));
      const replySpy = vi.spyOn(interaction, "reply");

      await bot.onInteractionCreate(interaction);

      expect(
        (replySpy.mock.calls[0][0] as InteractionReplyOptions).content,
      ).toContain("unexpected error");
    });

    it("should safely handle expected errors", async () => {
      const interaction = {
        isChatInputCommand: vi.fn().mockReturnValue(true),
        commandName: "test",
        reply: vi.fn(),
      } as unknown as ChatInputCommandInteraction;
      mockCommand.execute = vi
        .fn()
        .mockResolvedValue(
          err(new ChattyError("foo", { isUnexpected: false })),
        );
      const replySpy = vi.spyOn(interaction, "reply");

      await bot.onInteractionCreate(interaction);

      expect(
        (replySpy.mock.calls[0][0] as InteractionReplyOptions).content,
      ).toContain("Error:");
    });
  });
});
