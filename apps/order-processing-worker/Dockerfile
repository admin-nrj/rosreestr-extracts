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

# Debug: show generated package.json
RUN echo "=== Generated package.json ===" && cat /app/dist/apps/order-processing-worker/package.json

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy built application and package.json
COPY --from=builder /app/dist/apps/order-processing-worker ./

# Check if package.json exists, if not copy from build
RUN if [ ! -f package.json ]; then \
      echo "package.json not found in dist, this is expected with generatePackageJson"; \
    fi

# Install production dependencies from generated package.json
RUN if [ -f package.json ]; then npm ci --only=production; fi

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

# Start the worker
CMD ["/app/docker-entrypoint.sh"]
