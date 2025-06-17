FROM node:20.11.0-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /chatty

COPY package.json ./
COPY pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY prisma ./prisma
RUN pnpm prisma generate

COPY src ./src
COPY tsconfig.json ./

RUN pnpm build
COPY .env ./
ENV NODE_ENV=production
CMD pnpm start