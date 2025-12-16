#!/bin/sh
set -e

echo "🔨 Building @repo/common package..."
cd /app/packages/common && npm run build

echo "📦 Checking @repo/common in node_modules..."
ls -la /app/node_modules/@repo/ || echo "Workspace linking might be needed"

echo "� Pushing Prisma schema to database..."
cd /app/apps/api-gateway
npx prisma db push --skip-generate || echo "Database already in sync"

echo "🚀 Starting api-gateway in development mode with hot reload..."
npm run start:dev
