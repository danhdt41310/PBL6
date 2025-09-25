# Meetings Service

A NestJS microservice for managing meetings and meeting attendees in the PBL6 application.

## Features

- Meeting management (create, read, update, delete)
- Meeting attendee tracking
- Support for public/private meetings
- PostgreSQL database with TypeORM
- Redis microservice communication
- Hot reload in development mode

## Database Schema

### Meetings Table
- `meeting_id` (Primary Key)
- `class_id` (Foreign Key to classes)
- `topic` (Meeting topic/title)
- `start_time` (Meeting start timestamp)
- `end_time` (Meeting end timestamp)
- `type` (public/private, default: public)
- `created_at` (Creation timestamp)

### Meeting Attendees Table
- `attendance_id` (Primary Key)
- `meeting_id` (Foreign Key to meetings)
- `user_id` (Foreign Key to users)
- `joined_at` (Join timestamp)
- `device_id` (Optional device identifier)
- Unique constraint on (meeting_id, user_id)

## API Messages (Redis)

### Meetings
- `get_meeting_hello` - Test message
- `create_meeting` - Create a new meeting
- `update_meeting` - Update an existing meeting
- `get_meeting_by_id` - Get meeting by ID
- `get_meetings_by_class` - Get all meetings for a class

### Meeting Attendees
- Coming soon...

## Environment Variables

- `DATABASE_HOST` - PostgreSQL host (default: localhost)
- `DATABASE_PORT` - PostgreSQL port (default: 5432)
- `DATABASE_NAME` - Database name (default: meetings_db)
- `DATABASE_USER` - Database user (default: postgres)
- `DATABASE_PASSWORD` - Database password (default: postgres123)
- `REDIS_HOST` - Redis host (default: localhost)
- `REDIS_PORT` - Redis port (default: 6379)
- `PORT` - Service port (default: 3004)

## Running the Service

### Development
```bash
npm run start:dev --workspace=meetings-service
```

### Production
```bash
npm run build --workspace=meetings-service
npm run start:prod --workspace=meetings-service
```

### Docker
```bash
# Development with hot reload
docker-compose -f docker-compose.dev.yml up meetings-service

# Production
docker-compose up meetings-service
```
