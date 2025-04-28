import {
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
import { User } from "../generated/prisma/index.js";
import type { ICommand, IUserRepository } from "../types/interfaces.js";

export class LeaderboardCommand implements ICommand {
  public data: SlashCommandBuilder;
  private userRepository: IUserRepository;

  constructor(userRepository: IUserRepository) {
    this.userRepository = userRepository;
    this.data = new SlashCommandBuilder()
      .setName("leaderboard")
      .setDescription(`Check your server's Chattiest users!`)
      .setContexts(InteractionContextType.Guild);
  }

  async execute(interaction: CommandInteraction) {
    const leaderboardResult = await this.userRepository.getTopUsers(
      interaction.guild!.id,
      10,
    );

    if (leaderboardResult.isErr()) {
      return err(leaderboardResult.error);
    }

    const components = this.makeComponents(
      leaderboardResult.value,
      interaction.guild!,
    );

    return ok({ components });
  }

  private makeComponents(leaderboard: Array<User>, guild: Guild) {
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
      section.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          leaderboard
            .map(
              (user, index) =>
                `\` ${`#${index + 1}`.padStart(pad ? 3 : 2, " ")} \` ${user.username} - **${user.messages}** message${user.messages !== 1 ? "s" : ""}`,
            )
            .join("\n"),
        ),
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
