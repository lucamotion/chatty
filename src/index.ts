/* v8 ignore start */
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import { Client, GatewayIntentBits } from "discord.js";
import "dotenv/config";
import { Bot } from "./bot.js";
import { EmojiCommand } from "./commands/emoji.js";
import { GraphCommand } from "./commands/graph.js";
import { LeaderboardCommand } from "./commands/leaderboard.js";
import { StatsCommand } from "./commands/stats.js";
import {} from "./lib/charts.js";
import { PrismaClientProvider } from "./structs/database.js";
import { UserRepository } from "./structs/user-repository.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
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
  ],
  userRepository,
);

dayjs.extend(utc);

await bot.start();
