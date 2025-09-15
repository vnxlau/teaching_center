# Multi-stage Dockerfile for Teaching Center
# Supports different environments (development, pre-prod, production)

# Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy Prisma schema (needed for postinstall script)
COPY prisma/schema.prisma ./prisma/schema.prisma

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy application code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Set working directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy package files
COPY package*.json ./

# Copy Prisma schema (needed for postinstall script)
COPY --from=builder --chown=nextjs:nodejs /app/prisma/schema.prisma ./prisma/schema.prisma

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy Prisma schema and config
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma/schema.prisma ./schema.prisma

# Copy the built application
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next

# Note: Prisma client is already generated in builder stage via postinstall script

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application
CMD ["npm", "start"]
