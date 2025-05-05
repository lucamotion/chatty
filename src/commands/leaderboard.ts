import {
  Client,
  CommandInteraction,
  ContainerBuilder,
  Guild,
  InteractionContextType,
  SectionBuilder,
  SlashCommandBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
} from "discord.js";
import { err, ok } from "neverthrow";
import type { ICommand, IUserRepository } from "../types/interfaces.js";

export class LeaderboardCommand implements ICommand {
  public data: SlashCommandBuilder;
  private userRepository: IUserRepository;
  private client: Client;

  constructor(userRepository: IUserRepository, client: Client) {
    this.userRepository = userRepository;
    this.data = new SlashCommandBuilder()
      .setName("leaderboard")
      .setDescription(`Check your server's Chattiest users!`)
      .setContexts(InteractionContextType.Guild);
    this.client = client;
  }

  async execute(interaction: CommandInteraction) {
    const leaderboardResult = await this.userRepository.getTopUsers(
      interaction.guild!.id,
    );

    if (leaderboardResult.isErr()) {
      return err(leaderboardResult.error);
    }

    const components = await this.makeComponents(
      leaderboardResult.value,
      interaction.guild!,
    );

    return ok({ components });
  }

  private async makeComponents(
    leaderboard: Array<{ count: number; userId: string }>,
    guild: Guild,
  ) {
    const pad = leaderboard.length >= 10;

    const container = new ContainerBuilder();

    const section = new SectionBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`## Top chatters in ${guild.name}`),
    );

    if (leaderboard.length === 0) {
      section.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `We haven't recorded any messages in **${guild.name}** yet!`,
        ),
      );
    } else {
      const entries = [];

      for (const [index, user] of leaderboard.entries()) {
        let username;

        try {
          const discordUser = await this.client.users.fetch(user.userId);
          username = discordUser.username;
        } catch {
          username = "Unknown User";
        }

        entries.push(
          `\` ${`#${index + 1}`.padStart(pad ? 3 : 2, " ")} \` ${
            username
          } - **${user.count}** message${user.count !== 1 ? "s" : ""}`,
        );
      }

      section.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(entries.join("\n")),
      );
    }

    const iconUrl = guild.iconURL();
    if (iconUrl) {
      section.setThumbnailAccessory(new ThumbnailBuilder().setURL(iconUrl));
    }

    container.addSectionComponents(section);
    return [container];
  }
}
