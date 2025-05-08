import dayjs from "dayjs";
import tz from "dayjs/plugin/timezone.js";
import {
  APIInteractionDataResolvedChannel,
  CommandInteraction,
  ContainerBuilder,
  Guild,
  GuildBasedChannel,
  SectionBuilder,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
  User,
} from "discord.js";
import { err, ok } from "neverthrow";
import type { ICommand, IUserRepository } from "../types/interfaces.js";

dayjs.extend(tz);

export class ReactionCommand implements ICommand {
  public data: SlashCommandOptionsOnlyBuilder;
  private userRepository: IUserRepository;

  constructor(userRepository: IUserRepository) {
    this.userRepository = userRepository;
    this.data = new SlashCommandBuilder()
      .setName("reaction")
      .setDescription(`Check the most popular reactions`)

      .addUserOption((option) =>
        option
          .setName("reactor")
          .setDescription("Check a user's most sent reactions")
          .setRequired(false),
      )
      .addUserOption((option) =>
        option
          .setName("reactee")
          .setDescription("Check a user's most received reactions")
          .setRequired(false),
      )
      .addChannelOption((option) =>
        option
          .setName("channel")
          .setDescription("The channel to fetch reactions from")
          .setRequired(false),
      );
  }

  async execute(interaction: CommandInteraction) {
    const reactor = interaction.options.get("reactor")?.user;
    const reactee = interaction.options.get("reactee")?.user;

    const channel = interaction.options.get("channel")?.channel ?? undefined;

    const topResult = await this.userRepository.getTopReactions(
      interaction.guild!.id,
      channel?.id,
      reactor?.id,
      reactee?.id,
    );

    if (topResult.isErr()) {
      return err(topResult.error);
    }

    const top = topResult.value;

    const components = this.makeComponents(
      top,
      interaction.guild!,
      channel,
      reactor,
      reactee,
    );

    return ok({ components, allowedMentions: { users: [] } });
  }

  private makeComponents(
    leaderboard: Array<{ count: number; emoji: string }>,
    guild: Guild,
    channel?: GuildBasedChannel | APIInteractionDataResolvedChannel,
    reactor?: User,
    reactee?: User,
  ) {
    const pad = leaderboard.length >= 10;

    const container = new ContainerBuilder();

    const section = new SectionBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `## Top reactions${reactee ? ` to <@${reactee.id}>'s messages` : reactor ? ` from <@${reactor.id}>` : ""} in ${channel ? ` <#${channel.id}>` : guild.name}`,
      ),
    );

    if (leaderboard.length === 0) {
      section.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`No reactions recorded yet!`),
      );
    } else {
      const entries = [];

      for (const [index, { count, emoji }] of leaderboard.entries()) {
        entries.push(
          `\` ${`#${index + 1}`.padStart(pad ? 3 : 2, " ")} \` ${
            emoji
          } - **${count}** reaction${count !== 1 ? "s" : ""}`,
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
