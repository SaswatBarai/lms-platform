# -----------------------------
# 1️⃣ Base image for dependencies
# -----------------------------
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY package*.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile


# -----------------------------
# 2️⃣ Build stage (for TypeScript)
# -----------------------------
FROM base AS build
COPY . .
RUN pnpm db:generate
RUN pnpm run build


# -----------------------------
# 3️⃣ Production runtime stage
# -----------------------------
FROM node:20-alpine AS production
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
COPY prisma ./prisma
EXPOSE 4001
CMD [ "pnpm", "start" ]
