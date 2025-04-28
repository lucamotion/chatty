import { err, ok } from "neverthrow";
import type {
  IPrismaClientProvider,
  IUserRepository,
} from "../types/interfaces.js";
import { ChattyError } from "./error.js";

export class UserRepository implements IUserRepository {
  private prisma: IPrismaClientProvider;

  constructor(prisma: IPrismaClientProvider) {
    this.prisma = prisma;
  }

  async trackMessage(
    userId: string,
    username: string,
    guildId: string,
    guildName: string,
  ) {
    const database = this.prisma.getClient();

    try {
      const user = await database.user.upsert({
        where: { id_guildId: { id: userId, guildId } },
        update: { username, messages: { increment: 1 }, lastSeen: new Date() },
        create: { id: userId, username, guildId, guildName, messages: 1 },
      });

      return ok(user);
    } catch (e) {
      return err(new ChattyError(e));
    }
  }

  async getUserStats(userId: string, guildId: string) {
    const database = this.prisma.getClient();

    try {
      const user = await database.user.findFirst({
        where: { id: userId, guildId },
      });

      let position: number = -1;

      if (user) {
        const userCount = await database.user.count({
          where: { guildId, messages: { gt: user.messages } },
        });

        position = userCount + 1;
      }

      if (!user) {
        return ok(null);
      }

      return ok({ ...user, position });
    } catch (e) {
      return err(new ChattyError(e));
    }
  }

  async getTopUsers(guildId: string, limit: number) {
    const database = this.prisma.getClient();

    try {
      const topUsers = await database.user.findMany({
        where: { guildId },
        orderBy: { messages: "desc" },
        take: limit,
      });

      return ok(topUsers);
    } catch (e) {
      return err(new ChattyError(e));
    }
  }
}
