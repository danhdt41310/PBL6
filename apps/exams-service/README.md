# Exams Service

A microservice for managing online exams, questions, and student submissions with grading capabilities.

## Features

- **Exam Management**: Create, update, and manage exams with scheduling
- **Question Bank**: Support for multiple question types (MCQ, essay, true/false)
- **Submissions**: Handle student exam submissions and answers
- **Grading System**: Teacher grading with feedback and scoring
- **Real-time Communication**: Redis-based microservice communication

## Database Schema

### Tables

- **exams**: Store exam details with scheduling and status
- **questions**: Question bank with different types and options
- **question_exams**: Junction table linking questions to exams with points
- **submissions**: Student exam submissions with scores and feedback
- **submission_answers**: Individual answers for each question in submissions

## API Endpoints

### Exams
- `POST /exams` - Create a new exam
- `GET /exams` - List all exams (with optional class filter)
- `GET /exams/:id` - Get exam details
- `PUT /exams/:id` - Update exam
- `DELETE /exams/:id` - Delete exam

### Questions
- `POST /exams/questions` - Create a new question
- `GET /exams/questions` - List all questions
- `GET /exams/:examId/questions` - Get questions for specific exam

### Submissions
- `POST /exams/submissions` - Submit exam answers
- `GET /exams/:examId/submissions` - Get submissions for exam
- `GET /exams/submissions/:id` - Get specific submission

## Microservice Events

- `get_exam_by_id` - Retrieve exam information
- `get_exams_by_class` - Get exams for a class
- `get_student_submissions` - Get student's submissions
- `grade_submission` - Grade a submission

## Environment Variables

- `DATABASE_HOST` - PostgreSQL host
- `DATABASE_PORT` - PostgreSQL port (5432)
- `DATABASE_NAME` - Database name (exams_db)
- `DATABASE_USER` - Database user
- `DATABASE_PASSWORD` - Database password
- `REDIS_HOST` - Redis host for microservice communication
- `REDIS_PORT` - Redis port (6379)
- `PORT` - Service port (3006)

## Development

```bash
npm run start:dev --workspace=exams-service
```

## Production

```bash
npm run build --workspace=exams-service
npm run start --workspace=exams-service
```
