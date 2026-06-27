# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json apps/backend/
COPY packages/database/package.json packages/database/
COPY packages/shared-types/package.json packages/shared-types/

# Install dependencies
RUN npm install -g pnpm && \
    pnpm install --frozen-lockfile

# Copy source code
COPY apps/backend ./apps/backend
COPY packages/database ./packages/database
COPY packages/shared-types ./packages/shared-types
COPY tsconfig.json ./
COPY tsconfig.build.json ./
COPY tsconfig.base.json ./
COPY nest-cli.json ./

# Build
RUN pnpm --filter backend build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install production dependencies only
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json apps/backend/
COPY packages/database/package.json packages/database/
COPY packages/shared-types/package.json packages/shared-types/

RUN npm install -g pnpm && \
    pnpm install --frozen-lockfile --prod

# Copy built application
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/shared-types/dist ./packages/shared-types/dist

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "dist/main"]
