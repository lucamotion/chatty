/* v8 ignore start */
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import { Client, GatewayIntentBits, Partials } from "discord.js";
import "dotenv/config";
import { FontLibrary } from "skia-canvas";
import { Bot } from "./bot.js";
import { EmojiCommand } from "./commands/emoji.js";
import { GraphCommand } from "./commands/graph.js";
import { LeaderboardCommand } from "./commands/leaderboard.js";
import { ReactionCommand } from "./commands/reaction.js";
import { StatsCommand } from "./commands/stats.js";
import {} from "./lib/charts.js";
import { PrismaClientProvider } from "./structs/database.js";
import { UserRepository } from "./structs/user-repository.js";

FontLibrary.use("Arial", "./default.ttf");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

const prisma = new PrismaClientProvider();
const userRepository = new UserRepository(prisma);
const bot = new Bot(
  client,
  process.env.DISCORD_BOT_TOKEN!,
  [
    new StatsCommand(userRepository),
    new LeaderboardCommand(userRepository),
    new GraphCommand(userRepository),
    new EmojiCommand(userRepository),
    new ReactionCommand(userRepository),
  ],
  userRepository,
);

dayjs.extend(utc);

await bot.start();
