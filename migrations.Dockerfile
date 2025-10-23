# Dockerfile for running database migrations
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.base.json ./
COPY nx.json ./

# Install ALL dependencies (including devDependencies for TypeORM CLI)
RUN npm ci

# Copy necessary source files for migrations
COPY libs/database ./libs/database
COPY libs/entities ./libs/entities
COPY libs/config ./libs/config
COPY libs/constants ./libs/constants

# Set environment
ENV NODE_ENV=production

# Script to read password from secret and run migrations
COPY <<EOF /app/run-migrations.sh
#!/bin/sh
# Read password from Docker secret
export DB_PASSWORD=\$(cat /run/secrets/db-password)
# Run migrations
npm run migration:up
EOF

RUN chmod +x /app/run-migrations.sh

# Run migrations script
CMD ["/app/run-migrations.sh"]
