# Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install necessary build tools and pnpm
RUN apk add --no-cache python3 make g++ curl && \
    npm install -g pnpm

# Copy package files
COPY package*.json pnpm-lock.yaml ./

    # Install dependencies (skip prepare scripts)
    RUN pnpm install --no-frozen-lockfile --ignore-scripts

    # Copy source code
COPY . .

# Build application (skip linting)
ENV NODE_ENV=production
ENV SKIP_LINT=true
RUN pnpm build

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy necessary files from builder
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Create uploads directory and set permissions
RUN mkdir -p uploads && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 && \
    chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port (default Next.js port)
EXPOSE 3000

ENV PORT=3000 \
    HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://localhost:3000/api/health || exit 1

# Start application
CMD ["node", "server.js"]