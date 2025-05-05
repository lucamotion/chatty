import {
  APIMessageTopLevelComponent,
  AttachmentBuilder,
  CommandInteraction,
  Interaction,
  JSONEncodable,
  Message,
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
}

export interface ICommand {
  data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
  execute(
    interaction: CommandInteraction,
  ): Promise<Result<CommandResult, ChattyError>>;
}

export interface IUserRepository {
  trackMessage(
    userId: string,
    guildId: string,
    channelId: string,
  ): Promise<Result<void, ChattyError>>;
  getUserStats(
    userId: string,
    guildId: string,
  ): Promise<
    Result<{ count: number; lastSeen?: Date } | undefined, ChattyError>
  >;
  getTopUsers(
    guildId: string,
  ): Promise<Result<Array<{ count: number; userId: string }>, ChattyError>>;
  getUserHourlyActivity(
    userId: string,
    guildId: string,
    channelId: string | undefined,
    period: "week" | "month" | "year" | "alltime",
  ): Promise<Result<Array<{ hour: number; counter: number }>, ChattyError>>;
  getGuildHourlyActivity(
    guildId: string,
    channelId: string | undefined,
    period: "week" | "month" | "year" | "alltime",
  ): Promise<Result<Array<{ hour: number; counter: number }>, ChattyError>>;
}

export interface IPrismaClientProvider {
  getClient(): PrismaClient;
}
