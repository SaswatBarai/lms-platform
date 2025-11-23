# -----------------------------
# 1️⃣ Base image for dependencies
# -----------------------------
FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /app
COPY package*.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile


# -----------------------------
# 2️⃣ Build stage (for TypeScript)
# -----------------------------
FROM base AS build
COPY . .
# Skip database generation during build - we'll do it at runtime
RUN pnpm run build


# -----------------------------
# 3️⃣ Production runtime stage
# -----------------------------
FROM node:20-alpine AS production
WORKDIR /app
RUN corepack enable
RUN apk add --no-cache curl
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
COPY prisma ./prisma
EXPOSE 4001
CMD [ "sh", "-c", "pnpm db:generate && npx prisma migrate deploy && pnpm start" ]
