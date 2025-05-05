import dayjs from "dayjs";
import { err, ok } from "neverthrow";
import { Prisma } from "../generated/prisma/client.js";
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

  async trackMessage(userId: string, guildId: string, channelId: string) {
    const database = this.prisma.getClient();

    try {
      const date = dayjs().utc().startOf("day").toDate();
      const hour = dayjs().utc().hour();

      await database.activityBucket.upsert({
        where: {
          guildId_channelId_userId_date_hour: {
            guildId,
            channelId,
            userId,
            date,
            hour,
          },
        },
        update: { counter: { increment: 1 } },
        create: {
          guildId,
          channelId,
          userId,
          date,
          hour,
          counter: 1,
        },
      });

      return ok();
    } catch (e) {
      return err(new ChattyError(e));
    }
  }

  async getUserStats(userId: string, guildId: string) {
    const database = this.prisma.getClient();

    try {
      const {
        _sum: { counter: messageCountInGuild },
      } = await database.activityBucket.aggregate({
        _sum: { counter: true },
        where: { guildId, userId },
      });

      const lastSeen = await database.activityBucket.findFirst({
        where: { guildId, userId },
        orderBy: { updatedAt: "desc" },
        take: 1,
        select: { updatedAt: true },
      });

      // const user = await database.user.findFirst({
      //   where: { id: userId, guildId },
      // });

      // let position: number = -1;

      // if (user) {
      //   const userCount = await database.user.count({
      //     where: { guildId, messages: { gt: user.messages } },
      //   });

      //   position = userCount + 1;
      // }

      if (messageCountInGuild === null) {
        return ok(undefined);
      }

      return ok({
        count: messageCountInGuild,
        lastSeen: lastSeen ? lastSeen.updatedAt : undefined,
      });
    } catch (e) {
      return err(new ChattyError(e));
    }
  }

  async getUserHourlyActivity(
    userId: string,
    guildId: string,
    channelId?: string,
    period: "week" | "month" | "year" | "alltime" = "alltime",
  ) {
    const database = this.prisma.getClient();

    let periodFilter: Prisma.DateTimeFilter<"ActivityBucket"> | undefined =
      undefined;

    if (period === "week") {
      periodFilter = {
        gte: dayjs.utc().startOf("day").subtract(7, "days").toDate(),
      };
    } else if (period === "month") {
      periodFilter = {
        gte: dayjs.utc().startOf("day").subtract(1, "month").toDate(),
      };
    } else if (period === "year") {
      periodFilter = {
        gte: dayjs.utc().startOf("day").subtract(1, "year").toDate(),
      };
    }

    try {
      const rawHours = await database.activityBucket.groupBy({
        where: { guildId, channelId, userId, date: periodFilter },
        by: ["hour"],
        _sum: { counter: true },
        orderBy: { hour: "asc" },
      });

      const hours = rawHours.map((activity) => ({
        hour: activity.hour,
        counter: activity._sum.counter!,
      }));

      return ok(hours);
    } catch (e) {
      return err(new ChattyError(e));
    }
  }

  async getGuildHourlyActivity(
    guildId: string,
    channelId?: string,
    period: "week" | "month" | "year" | "alltime" = "alltime",
  ) {
    const database = this.prisma.getClient();

    let periodFilter: Prisma.DateTimeFilter<"ActivityBucket"> | undefined =
      undefined;

    if (period === "week") {
      periodFilter = {
        gte: dayjs.utc().startOf("day").subtract(7, "days").toDate(),
      };
    } else if (period === "month") {
      periodFilter = {
        gte: dayjs.utc().startOf("day").subtract(1, "month").toDate(),
      };
    } else if (period === "year") {
      periodFilter = {
        gte: dayjs.utc().startOf("day").subtract(1, "year").toDate(),
      };
    }

    try {
      const rawHours = await database.activityBucket.groupBy({
        where: { guildId, channelId, date: periodFilter },
        by: ["hour"],
        _sum: { counter: true },
        orderBy: { hour: "asc" },
      });

      const hours = rawHours.map((activity) => ({
        hour: activity.hour,
        counter: activity._sum.counter!,
      }));

      return ok(hours);
    } catch (e) {
      return err(new ChattyError(e));
    }
  }

  async getTopUsers(guildId: string) {
    const database = this.prisma.getClient();

    try {
      const rawTopUsers = await database.activityBucket.groupBy({
        where: { guildId },
        by: ["userId"],
        _sum: { counter: true },
        orderBy: { _sum: { counter: "desc" } },
      });

      const topUsers = rawTopUsers
        .filter(({ _sum: counter }) => counter !== null)
        .map(({ _sum: { counter }, userId }) => ({
          count: counter!,
          userId,
        }));

      return ok(topUsers);
    } catch (e) {
      return err(new ChattyError(e));
    }
  }
}
