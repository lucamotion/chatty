import {
  APIMessageTopLevelComponent,
  AttachmentBuilder,
  CommandInteraction,
  Interaction,
  JSONEncodable,
  Message,
  MessageMentionOptions,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
} from "discord.js";
import { Result } from "neverthrow";
import { PrismaClient } from "../generated/prisma/index.js";
import { ChattyError } from "../structs/error.js";

export interface IBot {
  start(): Promise<void>;
  onMessageCreate(message: Message): Promise<void>;
  onInteractionCreate(message: Interaction): Promise<void>;
}

export interface CommandResult {
  components: Array<JSONEncodable<APIMessageTopLevelComponent>>;
  files?: Array<AttachmentBuilder>;
  allowedMentions?: MessageMentionOptions;
}

export interface ICommand {
  data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
  execute(
    interaction: CommandInteraction,
  ): Promise<Result<CommandResult, ChattyError>>;
}

export interface IUserRepository {
  trackMessage(
    guildId: string,
    channelId: string,
    userId: string,
  ): Promise<Result<void, ChattyError>>;
  getUserStats(
    guildId: string,
    userId: string,
  ): Promise<
    Result<{ count: number; lastSeen?: Date } | undefined, ChattyError>
  >;
  getTopUsers(
    guildId: string,
  ): Promise<Result<Array<{ count: number; userId: string }>, ChattyError>>;
  getUserHourlyActivity(
    guildId: string,
    channelId: string | undefined,
    userId: string,
    period: "week" | "month" | "year" | "alltime",
  ): Promise<Result<Array<{ hour: number; counter: number }>, ChattyError>>;
  getGuildHourlyActivity(
    guildId: string,
    channelId: string | undefined,
    period: "week" | "month" | "year" | "alltime",
  ): Promise<Result<Array<{ hour: number; counter: number }>, ChattyError>>;

  trackEmoji(
    guildId: string,
    channelId: string,
    userId: string,
    emoji: string,
    count: number,
  ): Promise<Result<void, ChattyError>>;
  getTopEmojis(
    guildId: string,
    channelId?: string,
    userId?: string,
  ): Promise<Result<Array<{ count: number; emoji: string }>, ChattyError>>;

  trackReaction(
    guildId: string,
    channelId: string,
    emoji: string,
    reactorId: string,
    reacteeId: string,
  ): Promise<Result<void, ChattyError>>;
  getTopReactions(
    guildId: string,
    channelId?: string,
    reactorId?: string,
    reacteeId?: string,
  ): Promise<Result<Array<{ count: number; emoji: string }>, ChattyError>>;
}

export interface IPrismaClientProvider {
  getClient(): PrismaClient;
}
