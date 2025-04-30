import {
  bold,
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
import { User as DBUser } from "../generated/prisma/index.js";
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

    const components = this.makeComponents(targetUser, stats.value);
    return ok({ components });
  }

  private makeComponents(
    targetUser: User,
    stats: (DBUser & { position: number }) | undefined,
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
      let positionText = `(#${stats.position})`;

      if (stats.position <= 10) {
        positionText = bold(positionText);
      }

      section.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `**${stats.messages}** message${stats.messages !== 1 ? "s" : ""} in \`${stats.guildName}\` ${positionText}` +
            `\nLast seen **${time(stats.lastSeen, TimestampStyles.RelativeTime)}**`,
        ),
      );
    }

    container.addSectionComponents(section);
    return [container];
  }
}
