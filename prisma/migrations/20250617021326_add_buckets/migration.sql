/*
  Warnings:

  - You are about to drop the `user` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "user";

-- CreateTable
CREATE TABLE "activity_bucket" (
    "guild_id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "hour" INTEGER NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "counter" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "activity_bucket_pkey" PRIMARY KEY ("guild_id","channel_id","user_id","date","hour")
);

-- CreateTable
CREATE TABLE "emoji_bucket" (
    "guild_id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "counter" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "emoji_bucket_pkey" PRIMARY KEY ("guild_id","channel_id","user_id","emoji")
);

-- CreateTable
CREATE TABLE "reaction_bucket" (
    "guild_id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "reactor_id" TEXT NOT NULL,
    "reactee_id" TEXT NOT NULL,
    "counter" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "reaction_bucket_pkey" PRIMARY KEY ("guild_id","channel_id","emoji","reactor_id","reactee_id")
);

-- CreateIndex
CREATE INDEX "activity_bucket_guild_id_idx" ON "activity_bucket"("guild_id");

-- CreateIndex
CREATE INDEX "activity_bucket_channel_id_idx" ON "activity_bucket"("channel_id");

-- CreateIndex
CREATE INDEX "activity_bucket_user_id_idx" ON "activity_bucket"("user_id");

-- CreateIndex
CREATE INDEX "activity_bucket_date_idx" ON "activity_bucket"("date");

-- CreateIndex
CREATE INDEX "activity_bucket_hour_idx" ON "activity_bucket"("hour");

-- CreateIndex
CREATE INDEX "emoji_bucket_guild_id_idx" ON "emoji_bucket"("guild_id");

-- CreateIndex
CREATE INDEX "emoji_bucket_channel_id_idx" ON "emoji_bucket"("channel_id");

-- CreateIndex
CREATE INDEX "emoji_bucket_user_id_idx" ON "emoji_bucket"("user_id");

-- CreateIndex
CREATE INDEX "emoji_bucket_emoji_idx" ON "emoji_bucket"("emoji");

-- CreateIndex
CREATE INDEX "reaction_bucket_guild_id_idx" ON "reaction_bucket"("guild_id");

-- CreateIndex
CREATE INDEX "reaction_bucket_channel_id_idx" ON "reaction_bucket"("channel_id");

-- CreateIndex
CREATE INDEX "reaction_bucket_emoji_idx" ON "reaction_bucket"("emoji");

-- CreateIndex
CREATE INDEX "reaction_bucket_reactor_id_idx" ON "reaction_bucket"("reactor_id");

-- CreateIndex
CREATE INDEX "reaction_bucket_reactee_id_idx" ON "reaction_bucket"("reactee_id");
