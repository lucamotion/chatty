import dayjs from "dayjs";
import tz from "dayjs/plugin/timezone.js";
import {
  APIInteractionDataResolvedChannel,
  CommandInteraction,
  ContainerBuilder,
  Guild,
  GuildBasedChannel,
  inlineCode,
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

export class EmojiCommand implements ICommand {
  public data: SlashCommandOptionsOnlyBuilder;
  private userRepository: IUserRepository;

  constructor(userRepository: IUserRepository) {
    this.userRepository = userRepository;
    this.data = new SlashCommandBuilder()
      .setName("emoji")
      .setDescription(`Check the most popular emojis`)

      .addUserOption((option) =>
        option
          .setName("user")
          .setDescription("User to check the emojis of")
          .setRequired(false),
      )
      .addChannelOption((option) =>
        option
          .setName("channel")
          .setDescription("The channel to fetch emojis from")
          .setRequired(false),
      );
  }

  async execute(interaction: CommandInteraction) {
    const targetUser = interaction.options.get("user")?.user;

    const channel = interaction.options.get("channel")?.channel ?? undefined;

    const topEmojisResult = await this.userRepository.getTopEmojis(
      interaction.guild!.id,
      channel?.id,
      targetUser?.id,
    );

    if (topEmojisResult.isErr()) {
      return err(topEmojisResult.error);
    }

    const topEmojis = topEmojisResult.value;

    const components = this.makeComponents(
      topEmojis,
      interaction.guild!,
      targetUser,
      channel,
    );

    return ok({ components });
  }

  private makeComponents(
    leaderboard: Array<{ count: number; emoji: string }>,
    guild: Guild,
    user?: User,
    channel?: GuildBasedChannel | APIInteractionDataResolvedChannel,
  ) {
    const pad = leaderboard.length >= 10;

    const container = new ContainerBuilder();

    const section = new SectionBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `## Top emojis${user ? ` from ${user.username}` : ""} in ${channel ? ` <#${channel.id}>` : guild.name}`,
      ),
    );

    if (leaderboard.length === 0) {
      section.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`No emojis recorded yet!`),
      );
    } else {
      const entries = [];

      for (const [index, { count, emoji }] of leaderboard.entries()) {
        const customName = emoji.match(/:(?<name>[^\d]+):/)?.groups?.name;
        entries.push(
          `\` ${`#${index + 1}`.padStart(pad ? 3 : 2, " ")} \` ${
            customName !== undefined ? inlineCode(customName) : emoji
          } - **${count}** use${count !== 1 ? "s" : ""}`,
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
