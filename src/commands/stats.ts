import {
  CommandInteraction,
  ContainerBuilder,
  SectionBuilder,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
  time,
  TimestampStyles,
  User,
} from "discord.js";
import { err, ok } from "neverthrow";

import type { ICommand, IUserRepository } from "../types/interfaces.js";
export class StatsCommand implements ICommand {
  public data: SlashCommandOptionsOnlyBuilder;
  private userRepository: IUserRepository;

  constructor(userRepository: IUserRepository) {
    this.userRepository = userRepository;
    this.data = new SlashCommandBuilder()
      .setName("stats")
      .setDescription(`Check a player's Chatty stats`)
      .addUserOption((option) =>
        option
          .setName("user")
          .setDescription("User to check the stats of")
          .setRequired(false),
      );
  }

  async execute(interaction: CommandInteraction) {
    const targetUser =
      interaction.options.get("user")?.user || interaction.user;

    const stats = await this.userRepository.getUserStats(
      targetUser.id,
      interaction.guild!.id,
    );

    if (stats.isErr()) {
      return err(stats.error);
    }

    const components = this.makeComponents(
      targetUser,
      interaction.guild!.name,
      stats.value,
    );

    return ok({ components });
  }

  private makeComponents(
    targetUser: User,
    guildName: string,
    stats: { count: number; lastSeen?: Date } | undefined,
  ) {
    const container = new ContainerBuilder();

    const section = new SectionBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `## **Stats for ${targetUser.username}**`,
        ),
      )
      .setThumbnailAccessory(
        new ThumbnailBuilder().setURL(targetUser.displayAvatarURL()),
      );

    if (!stats) {
      section.addTextDisplayComponents(
        new TextDisplayBuilder().setContent("No messages recorded yet."),
      );
    } else {
      // let positionText = `(#${stats.position})`;

      // if (stats.position <= 10) {
      //   positionText = bold(positionText);
      // }

      section.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `**${stats.count}** message${stats.count !== 1 ? "s" : ""} in \`${guildName}\`` +
            `\nLast seen **${stats.lastSeen ? time(stats.lastSeen, TimestampStyles.RelativeTime) : "Never"}**`,
        ),
      );
    }

    container.addSectionComponents(section);
    return [container];
  }
}
