# Chatty

This is a simple Discord bot that counts messages by server and user. Individual statistics can be viewed with `/stats` and a server's leaderboard can be viewed with `/leaderboard`.

This bot was created to help me better understand unit testing Discord bots.

## Setup

1. Fill in your `DATABASE_URL` and `DISCORD_BOT_TOKEN` in `.env.example`, rename to `.env`
2. `pnpm install` (install dependencies)
3. `pnpm prisma migrate dev` (apply Prisma schema to your database and generate types)
4. `pnpm build` (compile TypeScript)
5. `pnpm start` (run the bot)
