import {
  APIMessageTopLevelComponent,
  CommandInteraction,
  Interaction,
  JSONEncodable,
  Message,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
} from "discord.js";
import { Result } from "neverthrow";
import { PrismaClient, User } from "../generated/prisma/index.js";
import { ChattyError } from "../structs/error.js";

export interface IBot {
  start(): Promise<void>;
  onMessageCreate(message: Message): Promise<void>;
  onInteractionCreate(message: Interaction): Promise<void>;
}

export interface CommandResult {
  components: Array<JSONEncodable<APIMessageTopLevelComponent>>;
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
    username: string,
    guildId: string,
    guildName: string,
  ): Promise<Result<User, ChattyError>>;
  getUserStats(
    userId: string,
    guildId: string,
  ): Promise<Result<(User & { position: number }) | null, ChattyError>>;
  getTopUsers(
    guildId: string,
    limit: number,
  ): Promise<Result<Array<User>, ChattyError>>;
}

export interface IPrismaClientProvider {
  getClient(): PrismaClient;
}
