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
COPY apps/auth-service ./apps/auth-service

# Build the application
RUN npx nx build auth-service --prod

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy built application
COPY --from=builder /app/dist/apps/auth-service ./

# Install production dependencies only
RUN npm ci --only=production

# Set environment variables
ENV NODE_ENV=production

# Create entrypoint script using Docker heredoc syntax
COPY <<EOF /app/docker-entrypoint.sh
#!/bin/sh
# Read password from Docker secret if it exists
if [ -f /run/secrets/db-password ]; then
  export DB_PASSWORD=\$(cat /run/secrets/db-password)
fi
# Start the application
exec node main.js
EOF

RUN chmod +x /app/docker-entrypoint.sh

# Run as non-root user
USER node

# Expose gRPC port
EXPOSE 5001

# Start the service
CMD ["/app/docker-entrypoint.sh"]
