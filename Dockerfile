FROM node:20.11.0-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /chatty

#  add libraries; sudo so non-root user added downstream can get sudo
RUN apk add --no-cache \
build-base \
cairo-dev \
libpng-dev \
g++ \
pango-dev \
python3 

COPY package.json ./
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
RUN pnpm install
RUN pnpm approve-builds

COPY src ./src
COPY tsconfig.json ./

COPY prisma ./prisma
RUN pnpm prisma generate

RUN pnpm build
COPY .env ./
ENV NODE_ENV=production
CMD pnpm dev