# Single stage build for better compatibility
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY turbo.json ./
COPY apps/users-service/package*.json ./apps/users-service/
COPY packages/ ./packages/

# Install all dependencies
RUN npm ci

# Copy source code
    COPY apps/users-service/ ./apps/users-service/

# Build the application
RUN npm run build --workspace=users-service

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Change ownership of the app directory to the nestjs user
RUN chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 3001

CMD ["node", "apps/users-service/dist/main.js"]
