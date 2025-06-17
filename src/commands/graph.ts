import { Canvas } from "canvas";
import dayjs from "dayjs";
import tz from "dayjs/plugin/timezone.js";
import {
  APIInteractionDataResolvedChannel,
  AttachmentBuilder,
  CommandInteraction,
  ContainerBuilder,
  Guild,
  GuildBasedChannel,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  TextDisplayBuilder,
  User,
} from "discord.js";
import { err, ok } from "neverthrow";
import { Chart, ChartItem } from "../lib/charts.js";
import type { ICommand, IUserRepository } from "../types/interfaces.js";

dayjs.extend(tz);

export class GraphCommand implements ICommand {
  public data: SlashCommandOptionsOnlyBuilder;
  private userRepository: IUserRepository;

  constructor(userRepository: IUserRepository) {
    this.userRepository = userRepository;
    this.data = new SlashCommandBuilder()
      .setName("graph")
      .setDescription(`Check a player's Chatty graph`)

      .addUserOption((option) =>
        option
          .setName("user")
          .setDescription("User to check the graph of")
          .setRequired(false),
      )
      .addStringOption((option) =>
        option
          .setName("time-period")
          .setDescription("The time period to fetch stats from")
          .setChoices([
            { name: "Weekly", value: "week" },
            { name: "Monthly", value: "month" },
            { name: "Yearly", value: "year" },
            { name: "All time", value: "alltime" },
          ])
          .setRequired(false),
      )
      .addChannelOption((option) =>
        option
          .setName("channel")
          .setDescription("The channel to fetch stats from")
          .setRequired(false),
      )
      .addStringOption((option) =>
        option
          .setName("timezone")
          .setDescription("tz database timezone, like America/New_York")
          .setRequired(false),
      );
  }

  async execute(interaction: CommandInteraction) {
    const targetUser =
      interaction.options.get("user")?.user || interaction.user;

    const tzString = interaction.options.get("timezone")?.value?.toString();
    const tzOffset = dayjs()
      .tz(tzString || "Etc/UTC")
      .utcOffset();

    const channel = interaction.options.get("channel")?.channel ?? undefined;

    const timePeriod = (interaction.options.get("time")?.value || "alltime") as
      | "week"
      | "month"
      | "year"
      | "alltime";

    const guildHourlyResult = await this.userRepository.getGuildHourlyActivity(
      interaction.guild!.id,
      channel?.id,
      timePeriod,
    );

    if (guildHourlyResult.isErr()) {
      return err(guildHourlyResult.error);
    }

    const guildActivity = guildHourlyResult.value;
    const guildHourMap = new Map<number, number>();
    let guildMessageCount = 0;

    for (const { hour, counter } of guildActivity) {
      const adjustedHour =
        ((Math.floor((hour * 60 + tzOffset) / 60) % 24) + 24) % 24;
      guildMessageCount += counter;
      guildHourMap.set(adjustedHour, counter);
    }

    const userHourlyResult = await this.userRepository.getUserHourlyActivity(
      interaction.guild!.id,
      channel?.id,
      targetUser.id,
      timePeriod,
    );

    if (userHourlyResult.isErr()) {
      return err(userHourlyResult.error);
    }

    const userActivity = userHourlyResult.value;
    const userHourMap = new Map<number, number>();
    let userMessageCount = 0;

    for (const { hour, counter } of userActivity) {
      const adjustedHour =
        ((Math.floor((hour * 60 + tzOffset) / 60) % 24) + 24) % 24;
      userMessageCount += counter;
      userHourMap.set(adjustedHour, counter);
    }

    const { canvas, chart } = this.drawCanvas(
      userHourMap,
      userMessageCount,
      guildHourMap,
      guildMessageCount,
      targetUser,
      interaction.guild!,
      channel as GuildBasedChannel,
      tzOffset,
      timePeriod,
    );

    const pngBuffer = canvas.toBuffer("image/png");
    chart.destroy();

    const components = this.makeComponents(
      targetUser,
      interaction.guild!,
      channel,
      userMessageCount,
      guildMessageCount,
    );

    return ok({
      components,
      files: [new AttachmentBuilder(pngBuffer).setName("graph.png")],
    });
  }

  private makeComponents(
    user: User,
    guild: Guild,
    channel: GuildBasedChannel | APIInteractionDataResolvedChannel | undefined,
    totalUserMessages: number,
    totalGuildMessages: number,
  ) {
    const image = new MediaGalleryBuilder().addItems(
      new MediaGalleryItemBuilder().setURL("attachment://graph.png"),
    );

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `I've seen **${totalUserMessages}** message${totalUserMessages !== 1 ? "s" : ""} from **${user.username}** in ${channel === undefined ? guild.name : `<#${channel.id}>`}!` +
          `\nOut of **${totalGuildMessages}** message${totalGuildMessages !== 1 ? "s" : ""} in ${channel === undefined ? guild.name : `<#${channel.id}>`}, **${user.username}** sent **${((totalUserMessages / (totalGuildMessages || 1)) * 100).toFixed(2)}%**.`,
      ),
    );

    return [image, container];
  }

  private drawCanvas(
    hourMap: Map<number, number>,
    totalMessages: number,
    guildHourMap: Map<number, number>,
    totalGuildMessages: number,
    user: User,
    guild: Guild,
    channel: GuildBasedChannel | undefined,
    tzOffset: number,
    timePeriod: "week" | "month" | "year" | "alltime",
  ) {
    const canvas = new Canvas(650, 200);
    const chart = new Chart(canvas as unknown as ChartItem, {
      type: "line",
      data: {
        labels: Array.from(Array(24).keys()).map(
          (value) => `${value.toString().padStart(2, "0")}`,
        ),
        datasets: [
          {
            label: `${user.username}'s activity`,
            data: Array.from(Array(24).keys()).map(
              (hour) => (hourMap.get(hour) || 0) / (totalMessages || 1),
            ),
            borderColor: "hsl(200, 20%, 98%)",
            borderJoinStyle: "round",
            pointRadius: 0,
            borderCapStyle: "round",
            normalized: true,
          },
          {
            label: `Server activity`,
            data: Array.from(Array(24).keys()).map(
              (hour) =>
                (guildHourMap.get(hour) || 0) / (totalGuildMessages || 1),
            ),
            borderColor: "hsl(200, 25%, 30%)",
            borderJoinStyle: "round",
            pointRadius: 0,
            borderCapStyle: "round",
            borderDash: [15, 10],
            borderWidth: 3,
            normalized: true,
          },
        ],
      },
      options: {
        layout: { padding: { left: 10, right: 18 } },
        scales: {
          y: {
            ticks: { display: false },
            border: { display: false },
            grid: { display: false },
          },
          x: {
            ticks: {
              color: "hsl(200, 25%, 75%)",
              minRotation: 0,
              maxRotation: 0,
            },
            border: { display: false },
            grid: { display: false },
          },
        },
        plugins: {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          background: { backgroundColor: "hsl(200, 26%, 9%)" },
          legend: {
            display: true,
            position: "bottom",
            align: "center",
            labels: { color: "hsl(200, 25%, 75%)" },
          },
          title: {
            display: true,
            text: `${user.username}'s ${timePeriod === "alltime" ? `all-time` : `${timePeriod}ly`} activity in ${guild.name}${channel ? ` #${channel.name}` : ""} (UTC${tzOffset >= 0 ? "+" : "-"}${Math.abs(tzOffset / 60)})`,
            align: "center",
            position: "top",
            fullSize: false,
            color: "hsl(200, 20%, 98%)",
            font: { size: 16 },
          },
        },
      },
    });

    return { chart, canvas };
  }
}
