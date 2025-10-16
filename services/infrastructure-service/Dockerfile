# -----------------------------
# 1️⃣ Base image for dependencies
# -----------------------------
FROM node:20-alpine AS base
RUN  npm install -g pnpm 
WORKDIR /app
COPY package*.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile



# -----------------------------
# 2️⃣ Build stage (for TypeScript)
# -----------------------------
FROM base AS build
COPY . .
RUN pnpm run build



# -----------------------------
# 3️⃣ Production runtime stage
# -----------------------------
FROM node:20-alpine AS production
WORKDIR /app
RUN npm install -g pnpm
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
EXPOSE 4003
CMD [ "pnpm", "start" ]