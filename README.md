# HireDesk

HireDesk is a hiring-pipeline application for recruiters.

The project contains a NestJS backend, PostgreSQL database, Prisma ORM, JWT authentication, role-based authorization, and automated unit and E2E tests.

## Architecture

```text
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
Prisma ORM
  ↓
PostgreSQL Database
```

### Backend Flow

```text
HTTP Request
  ↓
Controller
  ↓
Service
  ↓
Prisma
  ↓
PostgreSQL
  ↓
Service
  ↓
Controller
  ↓
HTTP Response
```

### Main Backend Responsibilities

- Controller: receives and handles HTTP requests
- Service: contains application and business logic
- Prisma: communicates with the PostgreSQL database
- PostgreSQL: stores application data
- Module: organizes related controllers and services
- Guards: protect authenticated and role-based endpoints

## Tech Stack

### Backend

- NestJS
- TypeScript
- Prisma ORM
- PostgreSQL 17
- JWT
- bcrypt
- Jest
- Supertest

### Frontend

- Next.js
- React
- Tailwind CSS

### Development Tools

- Git
- GitHub
- Postman / Swagger

## Project Structure

```text
HireDesk/
│
├── backend/
│   ├── src/
│   │   ├── auth/
│   │   ├── candidates/
│   │   ├── interviews/
│   │   ├── feedback/
│   │   ├── jobs/
│   │   └── prisma/
│   │
│   └── test/
│       └── app.e2e-spec.ts
│
├── frontend/
│
└── README.md
```

## Prerequisites

Before running the backend, install:

- Node.js
- npm
- PostgreSQL 17
- Git

The backend requires a PostgreSQL database.

## Installation

Clone the repository:

```bash
git clone <your-github-repository-url>
cd HireDesk
```

Install backend dependencies:

```bash
cd backend
npm install
```

Install frontend dependencies:

```bash
cd ../frontend
npm install
```

## Environment Variables

The backend uses environment variables for configuration.

Create a `.env` file inside the `backend` directory.

Example:

```env
DATABASE_URL="your-postgresql-connection-string"
JWT_SECRET="your-jwt-secret"
```

Example format:

```env
DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/hiredesk"
JWT_SECRET="your-secret"
```

Do not commit `.env` files, passwords, database credentials, or JWT secrets to GitHub.

## Database

HireDesk uses PostgreSQL with Prisma ORM.

The main entities are:

```text
Job
 ↓
Candidate
 ↓
Interview
 ↓
Feedback
```

Authentication users are stored in the `User` table.

The database connection is configured using:

```text
DATABASE_URL
```

The JWT signing secret is configured using:

```text
JWT_SECRET
```

### Database Contract

The backend uses the Prisma database contract.

The contract can be generated with:

```bash
cd backend
npm run contract:emit
```

## Running the Application

The project contains separate frontend and backend applications.

### Backend

Open a terminal:

```bash
cd backend
npm install
npm run start:dev
```

The backend runs on:

```text
http://localhost:3001
```

### Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on:

```text
http://localhost:3000
```

## Development Ports

```text
Frontend
http://localhost:3000

Backend
http://localhost:3001
```

The frontend communicates with the backend API:

```text
Next.js :3000
      ↓
NestJS :3001
      ↓
PostgreSQL
```

## Authentication

HireDesk uses JWT authentication.

Passwords are hashed using bcrypt and are never returned in API responses.

### Register

**POST `/auth/register`**

Request:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Successful response:

```json
{
  "id": 1,
  "email": "user@example.com"
}
```

The password is not included in the response.

### Login

**POST `/auth/login`**

Request:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Successful response:

```json
{
  "access_token": "<JWT>",
  "refresh_token": "<JWT>"
}
```

The access token is used to access protected API endpoints.

The refresh token is used to obtain a new access token.

### Refresh Token

**POST `/auth/refresh`**

Request:

```json
{
  "refresh_token": "<refresh-token>"
}
```

Successful response:

```json
{
  "access_token": "<new-access-token>",
  "refresh_token": "<new-refresh-token>"
}
```

HireDesk uses refresh-token rotation.

After a successful refresh:

1. A new refresh token is issued.
2. The previous refresh token becomes invalid.
3. The new refresh-token hash replaces the previous stored hash.

Refresh tokens are stored using a SHA-256 digest followed by bcrypt hashing.

## Authorization and RBAC

HireDesk uses role-based access control.

Supported roles include:

- ADMIN
- RECRUITER
- INTERVIEWER
- MENTOR

Protected endpoints use:

- `JwtAuthGuard` for authentication
- `RolesGuard` for authorization
- `@Roles()` to define allowed roles

For example, candidate creation is restricted to:

```text
ADMIN
RECRUITER
```

If an authenticated user does not have the required role, the API returns:

```text
403 Forbidden
```

## API Endpoints

### Health

**GET `/health`**

Example response:

```json
{
  "status": "ok",
  "service": "HireDesk API"
}
```

### Authentication

**POST `/auth/register`**

Registers a new user.

**POST `/auth/login`**

Authenticates a user and returns access and refresh tokens.

**POST `/auth/refresh`**

Refreshes the access token and rotates the refresh token.

### Candidates

**GET `/candidates`**

Returns the list of candidates.

Authentication is required.

**POST `/candidates`**

Creates a new candidate.

Candidate creation requires:

```text
ADMIN
RECRUITER
```

### Jobs

**GET `/jobs`**

Returns the list of jobs.

**GET `/jobs/health`**

Returns the jobs module health status.

**POST `/jobs`**

Creates a new job.

### Interviews

**GET `/interviews`**

Returns interviews.

The endpoint requires authentication and one of:

```text
ADMIN
RECRUITER
INTERVIEWER
```

**POST `/interviews`**

Creates an interview.

The endpoint requires authentication and one of:

```text
ADMIN
RECRUITER
INTERVIEWER
```

**GET `/interviews/health`**

Returns the interviews module health status.

### Feedback

**GET `/feedback`**

Returns feedback records.

The endpoint requires:

```text
ADMIN
INTERVIEWER
```

**POST `/feedback`**

Creates feedback.

The endpoint requires:

```text
ADMIN
INTERVIEWER
```

**GET `/feedback/health`**

Returns the feedback module health status.

## Testing

HireDesk uses Jest for backend testing.

There are two main testing approaches:

```text
Unit Testing
     ↓
Test individual application logic
```

and:

```text
E2E Testing
     ↓
Test the application through HTTP
```

## Unit Tests

Unit tests test individual pieces of application logic.

Database dependencies such as Prisma can be mocked during unit testing.

Run the unit tests:

```bash
cd backend
npm test
```

The unit tests cover application services and authentication logic.

## E2E Tests

E2E means end-to-end testing.

E2E tests send HTTP requests to the NestJS application and verify the complete request flow.

HireDesk uses:

- Jest
- Supertest
- NestJS testing utilities
- PostgreSQL

The E2E test file is:

```text
backend/test/app.e2e-spec.ts
```

### Run E2E Tests

From the `backend` directory:

```bash
npm test -- --config ./test/jest-e2e.json
```

Expected result:

```text
Test Suites: 1 passed, 1 total
Tests:       23 passed, 23 total
```

## E2E Test Coverage

Run E2E tests with coverage:

```bash
npm test -- --config ./test/jest-e2e.json --coverage
```

The current E2E coverage result is:

```text
Statements: 92.22%
Branches:   72.83%
Functions:  89.13%
Lines:      91.25%
```

The E2E suite currently contains:

```text
23 passing tests
```

### Core E2E Areas

The E2E tests cover:

- Application health
- User registration
- User login
- Invalid login password
- Refresh tokens
- Refresh-token rotation
- Authentication protection
- Role-based authorization
- Candidates
- Interviews
- Feedback
- Jobs

### Interview Tests

The interview tests cover:

- GET interviews without authentication
- GET interviews with an interviewer role
- POST interview with a status
- POST interview without a status

The two POST tests also verify the different `status` paths in the interview service.

### Feedback Tests

The feedback tests cover:

- GET feedback without authentication
- GET feedback with interviewer role
- GET feedback health
- POST feedback with comments
- POST feedback without comments

The two POST tests verify both paths for optional feedback comments.

### Refresh Token Rotation Test

The refresh-token rotation E2E test verifies:

```text
Login
  ↓
Old refresh token
  ↓
POST /auth/refresh
  ↓
New refresh token
  ↓
Old refresh token becomes invalid
```

The test verifies that:

- A new refresh token is created.
- The new token is different from the old token.
- The stored hash matches the new token.
- The old token no longer matches.
- Reusing the old token returns `401 Unauthorized`.

## Authentication Flow

### Register

```text
Register
   ↓
Password hashed with bcrypt
   ↓
User stored in PostgreSQL
```

### Login

```text
Login
  ↓
Find user
  ↓
Compare password
  ↓
Create access token
  ↓
Create refresh token
  ↓
Hash refresh token
  ↓
Store refresh-token hash
  ↓
Return tokens
```

### Refresh

```text
Refresh token
  ↓
Verify token
  ↓
Find user
  ↓
Verify stored token hash
  ↓
Create new access token
  ↓
Create new refresh token
  ↓
Replace stored refresh-token hash
  ↓
Return new tokens
```

The old refresh token cannot be reused after successful rotation.

## Protected API Flow

A request to a protected endpoint follows this flow:

```text
Client
  ↓
Authorization: Bearer <access-token>
  ↓
JwtAuthGuard
  ↓
Verify JWT
  ↓
Attach user information
  ↓
RolesGuard
  ↓
Check user role
  ↓
Controller
  ↓
Service
  ↓
Database
```

If the JWT is missing or invalid:

```text
401 Unauthorized
```

If the JWT is valid but the user does not have the required role:

```text
403 Forbidden
```

## Testing Approach

### Unit Testing

Unit tests focus on individual pieces of application logic.

Dependencies such as Prisma can be mocked.

```text
Service
  ↓
Mock dependency
  ↓
Expected result
```

### E2E Testing

E2E tests verify the application through HTTP.

```text
Supertest
  ↓
HTTP Request
  ↓
NestJS Controller
  ↓
Service
  ↓
Prisma
  ↓
PostgreSQL
  ↓
HTTP Response
```

### Why Both?

Unit tests help verify application logic in isolation.

E2E tests help verify that the complete application flow works correctly.

Both provide different types of confidence.

## Git Workflow

The project uses Git and GitHub for source control.

Check the current status:

```bash
git status
```

Review changes:

```bash
git diff
```

Stage changes:

```bash
git add .
```

Commit changes:

```bash
git commit -m "Describe the change"
```

Push changes:

```bash
git push origin main
```

Run relevant tests before committing changes.

## Security Notes

- Passwords are never returned by the API.
- Passwords are hashed using bcrypt.
- Refresh tokens are not stored as plain text.
- Refresh tokens are stored using a SHA-256 digest followed by bcrypt hashing.
- JWT-protected endpoints require a valid access token.
- Role-protected endpoints require the correct user role.
- Secrets should be stored in environment variables.
- `.env` files should not be committed to Git.
- Database credentials should not be committed to GitHub.

## Current Backend Features

The backend currently includes:

- JWT authentication
- User registration
- User login
- bcrypt password hashing
- Refresh-token rotation
- JWT authentication guard
- Role-based authorization
- Candidates module
- Interviews module
- Feedback module
- Jobs module
- Prisma ORM
- PostgreSQL database
- Jest unit tests
- Jest + Supertest E2E tests
- E2E coverage testing

## Project Status

The HireDesk backend currently has:

- Authentication
- JWT access tokens
- Refresh tokens
- Refresh-token rotation
- Role-based authorization
- PostgreSQL database integration
- Prisma ORM
- Candidates module
- Interviews module
- Feedback module
- Jobs module
- Unit tests
- 23 passing E2E tests
- E2E coverage above 80% for statements, lines, and functions

Frontend development is being developed separately using Next.js.
