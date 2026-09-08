Yes. Here is the **complete `README.md` file**. Replace everything in your current README with this:

````markdown
# HireDesk

HireDesk is a hiring-pipeline application for recruiters.

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
````

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

* Controller: receives and handles HTTP requests
* Service: contains application and business logic
* Prisma: communicates with the PostgreSQL database
* PostgreSQL: stores application data
* Module: organizes related controllers and services
* Guards: protect authenticated and role-based endpoints

## Tech Stack

### Backend

* NestJS
* TypeScript
* Prisma ORM
* PostgreSQL 17
* JWT
* bcrypt
* Jest
* Supertest

### Frontend

* Next.js
* React
* Tailwind CSS

### Development Tools

* Git
* GitHub
* Postman / Swagger
* Docker

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
│
├── frontend/
│
└── README.md
```

## Running the Application

The project contains separate frontend and backend applications.

### Backend

Open a terminal and run:

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

Open another terminal and run:

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on:

```text
http://localhost:3000
```

## Environment Variables

The backend uses environment variables for configuration.

Create a `.env` file inside the `backend` directory.

Example:

```env
DATABASE_URL="your-postgresql-connection-string"
JWT_SECRET="your-jwt-secret"
```

Do not commit `.env` files or passwords/secrets to GitHub.

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

After a successful refresh, a new refresh token is issued and the previous refresh token becomes invalid.

Refresh tokens are stored securely using a SHA-256 digest followed by bcrypt hashing.

## Authorization and RBAC

HireDesk uses role-based access control.

Supported roles include:

* ADMIN
* RECRUITER
* INTERVIEWER
* MENTOR

Protected endpoints use:

* `JwtAuthGuard` for authentication
* `RolesGuard` for authorization
* `@Roles()` to define allowed roles

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

### Candidates

**GET `/candidates`**

Returns the list of candidates.

**POST `/candidates`**

Creates a new candidate.

Candidate creation requires an authenticated user with one of these roles:

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

Interview endpoints are protected by JWT authentication and role-based authorization.

### Feedback

Feedback endpoints are protected by JWT authentication and role-based authorization.

## Testing

HireDesk uses Jest for backend testing.

### Unit Tests

Unit tests test individual pieces of application logic.

Database dependencies such as Prisma can be mocked during unit testing.

Run unit tests:

```bash
cd backend
npm test
```

### E2E Tests

E2E means end-to-end testing.

E2E tests send HTTP requests to the running NestJS application and verify the complete request flow.

HireDesk uses Jest and Supertest for E2E testing.

Run E2E tests:

```bash
npm run test:e2e
```

### E2E Coverage

Run E2E tests with coverage:

```bash
npm run test:e2e -- --coverage
```

Coverage helps show which parts of the application were executed by the tests.

The core E2E suite covers areas including:

* Authentication
* Login
* Refresh tokens
* Refresh-token rotation
* Authorization
* Candidates
* Interviews
* Feedback
* Jobs

### Important Test Scenarios

Tests cover both successful and failure cases.

Examples include:

* Successful registration
* Duplicate registration
* Successful login
* Invalid email
* Invalid password
* Missing authentication
* Invalid JWT
* Unauthorized role access
* Successful refresh
* Invalid refresh token
* Refresh-token rotation
* Reuse of an old refresh token
* Candidate API behavior
* Interview API behavior
* Feedback API behavior
* Jobs API behavior

## Authentication Flow

The authentication flow works like this:

```text
Register
   ↓
Password hashed with bcrypt
   ↓
User stored in PostgreSQL
```

Login:

```text
Login
  ↓
Check user
  ↓
Compare password
  ↓
Create access token
  ↓
Create refresh token
  ↓
Store refresh-token hash
  ↓
Return tokens
```

Refresh:

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

The old refresh token cannot be reused after rotation.

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

## Development Ports

```text
Frontend
http://localhost:3000

Backend
http://localhost:3001
```

The frontend communicates with the backend API.

```text
Next.js :3000
      ↓
NestJS :3001
      ↓
PostgreSQL
```

## Current Backend Features

The backend currently includes:

* JWT authentication
* User registration
* User login
* bcrypt password hashing
* Refresh-token rotation
* JWT authentication guard
* Role-based authorization
* Candidates module
* Interviews module
* Feedback module
* Jobs module
* Prisma ORM
* PostgreSQL database
* Jest unit tests
* Jest + Supertest E2E tests
* E2E coverage testing

## Security Notes

* Passwords are never returned by the API.
* Passwords are hashed using bcrypt.
* Refresh tokens are not stored as plain text.
* Refresh tokens are hashed before being stored.
* JWT-protected endpoints require a valid access token.
* Role-protected endpoints require the correct user role.
* Secrets should be stored in environment variables.
* `.env` files should not be committed to Git.

## Project Status

HireDesk backend authentication, RBAC, database integration, and backend E2E testing are implemented.

Frontend development is being developed separately using Next.js.