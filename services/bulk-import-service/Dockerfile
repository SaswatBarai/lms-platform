# -----------------------------
# 1️⃣ Base image for dependencies
# -----------------------------
FROM node:20-alpine AS base

# Install OpenSSL and required dependencies for Prisma
RUN apk add --no-cache openssl openssl-dev libc6-compat

# Install pnpm directly
RUN npm install -g pnpm@latest

WORKDIR /app
COPY package*.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile


# -----------------------------
# 2️⃣ Build stage (for TypeScript)
# -----------------------------
FROM base AS build
COPY . .
# Generate Prisma client during build
RUN npx prisma generate
RUN pnpm run build


# -----------------------------
# 3️⃣ Production runtime stage
# -----------------------------
FROM node:20-alpine AS production
WORKDIR /app

# Install OpenSSL and required dependencies for Prisma runtime
RUN apk add --no-cache openssl openssl-dev libc6-compat curl

# Install pnpm for production stage
RUN npm install -g pnpm@latest

# Copy all node_modules (including Prisma binaries)
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma

EXPOSE 4004

# Prisma will auto-detect OpenSSL, but we can help it
ENV OPENSSL_CONF=/etc/ssl/openssl.cnf

# Generate Prisma client on startup (migrations handled by auth-service)
CMD [ "sh", "-c", "npx prisma generate && pnpm start" ]
