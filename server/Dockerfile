# Stage 1: Build stage
FROM node:22-alpine AS builder

# Install native compilation dependencies for SQLite and Bcrypt
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy root configurations and dependency manifests
COPY package*.json tsconfig.base.json ./
COPY shared/package*.json ./shared/
COPY server/package*.json ./server/

# Install dependencies (development + production)
RUN npm ci

# Copy package sources
COPY shared/src ./shared/src
COPY shared/tsconfig.json ./shared/tsconfig.json
COPY server/src ./server/src
COPY server/tsconfig*.json ./server/
COPY server/nest-cli.json ./server/

# Build packages
RUN npm run build -w shared
RUN npm run build -w server

# Prune development dependencies
RUN npm prune --omit=dev

# Stage 2: Runner stage
FROM node:22-alpine AS runner

WORKDIR /app

# Set production environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV SERVER_HOST=0.0.0.0

# Copy node_modules and built outputs
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/shared/package*.json ./shared/
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/server/package*.json ./server/
COPY --from=builder /app/server/dist ./server/dist

# Copy migrations folder (essential for runMigrations() at server startup)
COPY --from=builder /app/server/src/drizzle/migrations ./server/src/drizzle/migrations

# Expose server port
EXPOSE 3000

# Set working directory to the server package to run from the server context
WORKDIR /app/server

# Start the NestJS server
CMD ["node", "dist/main.js"]
