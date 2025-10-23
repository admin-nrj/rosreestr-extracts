# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.base.json ./
COPY nx.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY libs ./libs
COPY apps/api-gateway ./apps/api-gateway

# Build the application
RUN npx nx build api-gateway --prod

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy built application
COPY --from=builder /app/dist/apps/api-gateway ./

# Install production dependencies only
RUN npm ci --only=production

# Set environment variables
ENV NODE_ENV=production

# Run as non-root user
USER node

# Expose HTTP port
EXPOSE 3003

# Start the gateway
CMD ["node", "main.js"]
