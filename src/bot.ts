import { Client, Collection, Interaction, Message, Routes } from "discord.js";
import emojiRegex from "emoji-regex";
import type { IBot, ICommand, IUserRepository } from "./types/interfaces.js";

export class Bot implements IBot {
  private client: Client;
  private token: string;
  private commands: Array<ICommand>;
  private userRepository: IUserRepository;
  private commandsCollection: Collection<string, ICommand>;

  constructor(
    client: Client,
    token: string,
    commands: Array<ICommand>,
    userRepository: IUserRepository,
  ) {
    this.client = client;
    this.token = token;
    this.commands = commands;
    this.userRepository = userRepository;

    const commandsCollection = new Collection<string, ICommand>();
    for (const command of this.commands) {
      commandsCollection.set(command.data.name, command);
    }

    this.commandsCollection = commandsCollection;

    const wrapHandler =
      <T extends Message | Interaction>(fn: (arg: T) => Promise<void>) =>
      (arg: T) =>
        fn(arg).catch(console.error);

    this.client.on("ready", () => console.log("Signed in"));
    this.client.on(
      "messageCreate",
      wrapHandler(this.onMessageCreate.bind(this)),
    );
    this.client.on(
      "interactionCreate",
      wrapHandler(this.onInteractionCreate.bind(this)),
    );
  }

  async start() {
    await this.client.login(this.token);

    await this.client.rest.put(
      Routes.applicationGuildCommands(
        this.client.user!.id,
        "768596255697272862",
      ),
      { body: this.commands.map((command) => command.data.toJSON()) },
    );
  }

  async onMessageCreate(message: Message) {
    if (message.author.bot) {
      return;
    }
    if (!message.guild) {
      return;
    }

    await this.userRepository.trackMessage(
      message.guild.id,
      message.channel.id,
      message.author.id,
    );

    const unicodeEmojiMatches = message.content
      .matchAll(emojiRegex())
      .toArray();

    if (unicodeEmojiMatches.length > 0) {
      const emojiMap = new Map<string, number>();

      for (const [match] of unicodeEmojiMatches) {
        if (!emojiMap.get(match)) {
          emojiMap.set(match, 1);
        } else {
          emojiMap.set(match, emojiMap.get(match)! + 1);
        }
      }

      for (const [emoji, count] of emojiMap.entries()) {
        await this.userRepository.trackEmojis(
          message.guild.id,
          message.channel.id,
          message.author.id,
          emoji,
          count,
        );
      }
    }

    const customEmojiMatches =
      message.content.match(/(<a?):\w+:(\d{17,19}>)/g) || [];

    if (customEmojiMatches.length > 0) {
      const emojiMap = new Map<string, number>();

      for (const match of customEmojiMatches) {
        if (!emojiMap.get(match)) {
          emojiMap.set(match, 1);
        } else {
          emojiMap.set(match, emojiMap.get(match)! + 1);
        }
      }

      for (const [emoji, count] of emojiMap.entries()) {
        await this.userRepository.trackEmojis(
          message.guild.id,
          message.channel.id,
          message.author.id,
          emoji,
          count,
        );
      }
    }
  }

  async onInteractionCreate(interaction: Interaction) {
    if (!interaction.isChatInputCommand()) {
      return;
    }

    const command = this.commandsCollection.get(interaction.commandName);
    if (!command) {
      console.warn(`Missing command ${interaction.commandName}`);
      return;
    }

    const result = await command.execute(interaction);

    if (result.isErr()) {
      const error = result.error;

      if (error.isUnexpected) {
        result.error.source = command.data.name;
        console.error(result.error);

        await interaction.reply({
          content:
            "An unexpected error has occurred!" +
            "\nThis will be reported to the developer.",
        });
      } else {
        await interaction.reply({
          content: `**Error:** ${JSON.stringify(result.error.sourceError)}`,
        });
      }

      return;
    }

    await interaction.reply({
      components: result.value.components,
      files: result.value.files,
      flags: 1 << 15,
    });
  }
}
