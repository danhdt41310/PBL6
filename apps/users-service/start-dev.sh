#!/bin/sh
set -e

echo "🔨 Building @repo/common package..."
cd /app/packages/common && npm run build

echo "📦 Checking @repo/common in node_modules..."
ls -la /app/node_modules/@repo/ || echo "Workspace linking might be needed"

echo "🔄 Pushing Prisma schema to database..."
cd /app/apps/users-service
npx prisma db push --skip-generate || echo "Database already in sync"

echo "🚀 Starting users-service in development mode with hot reload..."
cd /app/apps/users-service
npm run start:dev
