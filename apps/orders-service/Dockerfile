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
COPY apps/orders-service ./apps/orders-service

# Build the application
RUN npx nx build orders-service --prod

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy built application
COPY --from=builder /app/dist/apps/orders-service ./

# Install production dependencies only
RUN npm ci --only=production

# Set environment variables
ENV NODE_ENV=production

# Create entrypoint script
RUN cat > /app/docker-entrypoint.sh << 'EOF'
#!/bin/sh
# Read password from Docker secret if it exists
if [ -f /run/secrets/db-password ]; then
  export DB_PASSWORD=$(cat /run/secrets/db-password)
fi
# Start the application
exec node main.js
EOF

RUN chmod +x /app/docker-entrypoint.sh

# Run as non-root user
USER node

# Expose gRPC port
EXPOSE 5003

# Start the service
CMD ["/app/docker-entrypoint.sh"]
