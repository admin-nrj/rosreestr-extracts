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
COPY apps/order-processing-worker ./apps/order-processing-worker

# Build the application
RUN npx nx build order-processing-worker --prod

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy built application
COPY --from=builder /app/dist/apps/order-processing-worker ./

# Install production dependencies only
RUN npm ci --only=production

# Set environment variables
ENV NODE_ENV=production

# Run as non-root user
USER node

# Start the worker
CMD ["node", "main.js"]
