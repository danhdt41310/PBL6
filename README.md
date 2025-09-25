# Microservices Project (PBL6)

A comprehensive microservices architecture built with NestJS, featuring multiple services including API Gateway, Users, Chats, Classes, Exams, and Meetings services.

## 🏗️ Architecture

This project follows a microservices pattern with the following services:

- **API Gateway** (Port 3000) - Main entry point and request routing
- **Users Service** - User management and authentication
- **Chats Service** - Real-time messaging functionality
- **Classes Service** - Class management
- **Exams Service** - Examination system
- **Meetings Service** - Meeting scheduling and management

## 🚀 Quick Start

### Prerequisites

Make sure you have the following installed:
- Docker & Docker Compose
- Node.js (>= 18)
- npm (>= 10.8.1)

### 1. Start the Project with Docker

To start all services with Docker:

```bash
npm run docker:up
```

This command will:
- Start all PostgreSQL databases
- Start Redis for caching
- Build and run all microservices
- Set up the complete development environment

### 2. Alternative Docker Commands

```bash
# Start only databases (useful for local development)
npm run db:setup

# Build Docker images without cache
npm run docker:build

# View logs from all services
npm run docker:logs

# Stop all services
npm run docker:down

# Clean up Docker resources
npm run clean
```

## 🧪 Testing the API

Once the services are running, you can test the API Gateway:

### Base Endpoint

**Health Check:**
```bash
curl http://localhost:3000/api
```

**Expected Response:**
```
Hello World 2134!
```

### API Documentation

The API Gateway runs on port 3000 with the global prefix `/api`:

- **Base URL:** `http://localhost:3000/api`
- **Health Check:** `GET http://localhost:3000/api`

### Service Endpoints

Each service is accessible through the API Gateway:

- **Users:** `http://localhost:3000/api/users`
- **Chats:** `http://localhost:3000/api/chats`
- **Classes:** `http://localhost:3000/api/classes`
- **Exams:** `http://localhost:3000/api/exams`
- **Meetings:** `http://localhost:3000/api/meetings`

## 🗄️ Database Information

The project uses PostgreSQL databases for each service:

- **Users DB:** Port 5433
- **Meetings DB:** Port 5436
- **Exams DB:** Port 5437
- **Chats DB:** Port 5438
- **Redis:** Port 6379

**Database Credentials:**
- Username: `postgres`
- Password: `postgres123`

## 📁 Project Structure

```
├── apps/                    # Microservices applications
│   ├── api-gateway/        # Main API Gateway
│   ├── users-service/      # User management
│   ├── chats-service/      # Messaging service
│   ├── classes-service/    # Class management
│   ├── exams-service/      # Examination system
│   └── meetings-service/   # Meeting management
├── packages/               # Shared packages
│   ├── eslint-config/     # ESLint configuration
│   ├── typescript-config/ # TypeScript configuration
│   └── ui/                # Shared UI components
├── docker-compose.dev.yml  # Development Docker setup
└── package.json           # Root package configuration
```

## 🛠️ Available Scripts

```bash
# Development
npm run dev              # Start all services in dev mode
npm run start:dev        # Alternative dev start command

# Docker
npm run docker:up        # Start all services with Docker
npm run docker:down      # Stop all Docker services
npm run docker:logs      # View Docker logs
npm run docker:build     # Build Docker images
npm run db:setup         # Start only databases

# Code Quality
npm run lint             # Run ESLint
npm run format           # Format code with Prettier
npm run check-types      # Type checking

# Build
npm run build            # Build all services

# Cleanup
npm run clean            # Clean Docker resources
```

## 🔧 Troubleshooting

### Common Issues

1. **Port conflicts:** Make sure ports 3000, 5433-5438, and 6379 are available
2. **Docker issues:** Try `npm run clean` to remove all containers and volumes
3. **Database connection:** Ensure PostgreSQL containers are running with `docker ps`

### Logs

To check service logs:
```bash
npm run docker:logs
```

To check specific service logs:
```bash
docker compose -f docker-compose.dev.yml logs -f [service-name]
```

## 🌟 Features

- **Microservices Architecture:** Scalable and maintainable service separation
- **Docker Support:** Complete containerization for easy deployment
- **Database Per Service:** Each service has its own PostgreSQL database
- **Redis Caching:** Centralized caching solution
- **TypeScript:** Full TypeScript support across all services
- **Hot Reload:** Development mode with automatic restart
- **CORS Enabled:** Ready for frontend integration

## 📝 Next Steps

1. Test the base endpoint: `http://localhost:3000/api`
2. Explore individual service endpoints
3. Check the database connections
4. Review service logs for any issues
5. Start building your application features!

For more detailed information about each service, check the individual README files in their respective directories.
