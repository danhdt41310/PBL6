# Single stage build for better compatibility
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY turbo.json ./
COPY apps/api-gateway/package*.json ./apps/api-gateway/
COPY packages/ ./packages/

# Install all dependencies
RUN npm ci

# Copy source code
COPY apps/api-gateway/ ./apps/api-gateway/

# Build the application
RUN npm run build --workspace=api-gateway

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Change ownership of the app directory to the nestjs user
RUN chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 3000

CMD ["node", "apps/api-gateway/dist/main.js"]
