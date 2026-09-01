# HireDesk

## Day 1 Architecture Notes

HireDesk is a hiring-pipeline application for recruiters.

### Basic Architecture

User
↓
Next.js Frontend
↓
NestJS API
↓
Controllers
↓
Services / Business Logic
↓
PostgreSQL Database

### Backend Flow

HTTP Request
↓
Controller
↓
Service
↓
Database
↓
Service
↓
Controller
↓
HTTP Response

### Main Backend Responsibilities

- Controller: receives and handles HTTP requests
- Service: contains application/business logic
- PostgreSQL: stores application data
- Module: organizes related controllers and services

### Current Backend

- NestJS
- PostgreSQL 17
- TypeORM
- Git/GitHub

### Current Endpoint

GET /health

Response:

{
  "status": "ok",
  "service": "HireDesk API"
}
