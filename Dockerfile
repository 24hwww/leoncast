# ============================================
# STAGE 1: Frontend Builder (React + Vite)
# ============================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/web

# Copy frontend package files
COPY apps/web/package*.json ./

# Install ALL dependencies (including devDependencies needed for build)
RUN npm ci

# Copy frontend source
COPY apps/web/ ./

# Build frontend
RUN npm run build

# ============================================
# STAGE 2: Backend Builder
# ============================================
FROM node:20-alpine AS backend-builder

# Install build dependencies
RUN apk add --no-cache \
    build-base \
    g++ \
    cairo-dev \
    pango-dev \
    jpeg-dev \
    giflib-dev \
    librsvg-dev \
    python3 \
    openssl-dev

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies
RUN npm ci

# Copy server source
COPY apps/server/ ./apps/server/

# Generate Prisma Client
RUN npx prisma generate --schema=./apps/server/prisma/schema.prisma

# ============================================
# STAGE 3: Production Runtime
# ============================================
FROM node:20-alpine AS runner

# Install runtime dependencies
RUN apk add --no-cache \
    ffmpeg \
    openssl \
    cairo \
    pango \
    jpeg \
    giflib \
    librsvg \
    ttf-freefont

WORKDIR /app

# Copy package files
COPY --from=backend-builder /app/package*.json ./

# Install ONLY production dependencies
RUN npm ci --only=production

# Copy generated Prisma Client
COPY --from=backend-builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=backend-builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Copy server application
COPY --from=backend-builder /app/apps/server ./apps/server

# Copy frontend build
COPY --from=frontend-builder /app/web/dist ./apps/web/dist

# Copy scenarios directory structure
COPY apps/scenarios ./apps/scenarios

# Environment
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start command
CMD ["sh", "-c", "npx prisma db push --schema=./apps/server/prisma/schema.prisma --accept-data-loss && node apps/server/index.js"]