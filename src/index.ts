/* v8 ignore start */
import { Client, GatewayIntentBits } from "discord.js";
import "dotenv/config";
import { Bot } from "./bot.js";
import { LeaderboardCommand } from "./commands/leaderboard.js";
import { StatsCommand } from "./commands/stats.js";
import { PrismaClientProvider } from "./structs/database.js";
import { UserRepository } from "./structs/user-repository.js";

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

const prisma = new PrismaClientProvider();
const userRepository = new UserRepository(prisma);
const bot = new Bot(
  client,
  process.env.DISCORD_BOT_TOKEN!,
  [new StatsCommand(userRepository), new LeaderboardCommand(userRepository)],
  userRepository,
);

await bot.start();
