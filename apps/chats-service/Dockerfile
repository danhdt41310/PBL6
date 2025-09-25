# Single stage build for better compatibility
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY turbo.json ./
COPY apps/chats-service/package*.json ./apps/chats-service/
COPY packages/ ./packages/

# Install all dependencies
RUN npm ci

# Copy source code
COPY apps/chats-service/ ./apps/chats-service/

# Build the application
RUN npm run build --workspace=chats-service

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Change ownership of the app directory to the nestjs user
RUN chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 3005

CMD ["node", "apps/chats-service/dist/main.js"]
