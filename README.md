Absolutely. Copy everything below at once and replace your current `README.md` with it.

````markdown
# HireDesk

HireDesk is a recruitment management application for managing candidates, jobs, interviews, feedback, dashboards, authentication, role-based access control, and administrator-controlled user onboarding.

## Live Demo

- **Frontend:** https://hiredesk-kappa.vercel.app
- **User Management:** https://hiredesk-kappa.vercel.app/users
- **Backend:** https://hiredesk-yesm.onrender.com
- **Backend Health:** https://hiredesk-yesm.onrender.com/health

## Features

- Candidate management with CRUD, search, filtering, sorting, and pagination
- Job management with CRUD, filtering, sorting, and pagination
- Interview scheduling and management
- Interview feedback management
- Recruitment dashboard
- JWT authentication
- bcrypt password hashing
- Refresh-token rotation
- Role-based access control
- Admin-controlled user onboarding
- Email-based account activation using Brevo
- HTTP-only cookies for authentication
- Google OAuth support
- Backend unit and E2E testing
- GitHub Actions CI

## Tech Stack

### Frontend
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS

### Backend
- NestJS
- TypeScript
- Prisma
- PostgreSQL

### Authentication & Email
- JWT
- bcrypt
- HTTP-only cookies
- Brevo Transactional Email API

### Testing
- Jest
- Supertest
- ESLint
- TypeScript

## Project Structure

```text
HireDesk/
├── backend/
│   ├── src/
│   │   ├── auth/
│   │   ├── candidates/
│   │   ├── feedback/
│   │   ├── interviews/
│   │   ├── jobs/
│   │   └── prisma/
│   ├── migrations/
│   ├── scripts/
│   └── test/
├── frontend/
│   ├── app/
│   │   ├── api/
│   │   ├── candidates/
│   │   ├── dashboard/
│   │   ├── feedback/
│   │   ├── interviews/
│   │   ├── jobs/
│   │   ├── login/
│   │   └── users/
│   ├── lib/
│   └── proxy.ts
├── docs/
├── .github/
│   └── workflows/
└── README.md
````

## Prerequisites

* Node.js 22+
* npm
* PostgreSQL 15+
* Git

## Local Setup

### 1. Clone the Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd HireDesk
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `.env` from `.env.example`.

**PowerShell:**

```powershell
Copy-Item .env.example .env
```

**Bash:**

```bash
cp .env.example .env
```

### 3. Database Setup

From the `backend` directory:

```bash
npx prisma db init
npx prisma db migrate
```

### 4. Create Admin

Configure the admin details in `.env` and run:

```bash
npm run bootstrap:admin
```

### 5. Start Backend

```bash
npm run start:dev
```

### 6. Start Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

## Environment Variables

### Backend

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/hiredesk"
JWT_SECRET="your-secret"

ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="your-password"
ADMIN_NAME="HireDesk Admin"

BREVO_API_KEY="your-brevo-api-key"
BREVO_FROM="verified-sender@example.com"

FRONTEND_URL="http://localhost:3000"

GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/google/callback"

PORT=3001
```

### Frontend

```env
BACKEND_URL="http://localhost:3001"
```

Never commit `.env` files, API keys, passwords, database credentials, JWT secrets, or OAuth secrets.

Application Workflow

Recruitment Workflow

Admin / Recruiter Login
        ↓
Dashboard
        ↓
Create or Manage Jobs
        ↓
Add Candidates
        ↓
Associate Candidates with Jobs
        ↓
Schedule Interviews
        ↓
Conduct Interviews
        ↓
Add Interview Feedback
        ↓
Review Recruitment Data

User Onboarding Workflow

Admin Login
        ↓
Create Internal User
        ↓
Assign Role
        ↓
Activation Email via Brevo
        ↓
User Opens Activation Link
        ↓
User Sets Password
        ↓
Account Becomes ACTIVE
        ↓
User Logs In
        ↓
Access Based on Assigned Role

Candidates are recruitment records and are not authenticated system users.

## Authentication & Authorization

HireDesk uses JWT-based authentication.

```text
Login
  ↓
Password verification
  ↓
JWT authentication
  ↓
HTTP-only cookies
  ↓
Protected API routes
  ↓
Role-based authorization
```

Supported roles:

| Role        | Access                                   |
| ----------- | ---------------------------------------- |
| ADMIN       | User management and recruitment features |
| RECRUITER   | Candidate and recruitment management     |
| INTERVIEWER | Interviews and feedback                  |
| MENTOR      | Restricted candidate access              |

## User Onboarding

Admin-controlled onboarding works as follows:

```text
Admin provisions user
        ↓
Activation email sent through Brevo
        ↓
User opens activation link
        ↓
User sets password
        ↓
Account becomes ACTIVE
        ↓
User logs in
```

Candidates are recruitment records and are not authenticated system users.

## Main Frontend Routes

| Route               | Purpose               |
| ------------------- | --------------------- |
| `/login`            | Login                 |
| `/dashboard`        | Dashboard             |
| `/candidates`       | Candidate management  |
| `/jobs`             | Job management        |
| `/interviews`       | Interview management  |
| `/feedback`         | Feedback management   |
| `/users`            | Admin user management |
| `/activate/[token]` | Account activation    |

## Main Backend APIs

### Authentication

```text
POST /auth/register
POST /auth/login
POST /auth/refresh
POST /auth/activate
GET  /auth/me
GET  /auth/google
GET  /auth/google/callback
```

### Candidates

```text
GET    /candidates
GET    /candidates/:id
POST   /candidates
PUT    /candidates/:id
DELETE /candidates/:id
```

### Jobs

```text
GET    /jobs
GET    /jobs/:id
POST   /jobs
PUT    /jobs/:id
DELETE /jobs/:id
```

### Interviews

```text
GET    /interviews
POST   /interviews
PUT    /interviews/:id
DELETE /interviews/:id
```

### Feedback

```text
GET    /feedback
POST   /feedback
GET    /feedback/:id
PUT    /feedback/:id
DELETE /feedback/:id
```

### Dashboard & Users

```text
GET  /health
GET  /dashboard
GET  /users
POST /users
PUT  /users/:id
```

## Testing

### Backend Unit Tests

```bash
cd backend
npm test -- --runInBand
```

### Backend Coverage

```bash
npm run test:cov -- --runInBand
```

### Backend E2E Tests

```bash
npm run test:e2e -- --runInBand
```

### Frontend Lint

```bash
cd frontend
npm run lint
```

### TypeScript Check

```bash
npx tsc --noEmit
```

### Production Build

```bash
npm run build
```

## CI/CD

GitHub Actions runs:

* Frontend lint
* TypeScript checks
* Frontend build
* Backend unit tests
* Backend coverage
* Backend E2E tests

## Google OAuth

Google OAuth is implemented and requires Google Cloud OAuth credentials.

Required variables:

```env
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GOOGLE_REDIRECT_URI="..."
```

## Deployment

* **Frontend:** Vercel
* **Backend:** Render
* **Database:** PostgreSQL

Production links are provided at the top of this README.

## Database

PostgreSQL is used as the primary database and Prisma is used for database access and migrations.

Main entities:

```text
User
Candidate
Job
Interview
Feedback
```

The database ERD is available at:

```text
backend/docs/ERD.md
```

## Security

* Passwords are hashed using bcrypt.
* JWT authentication protects secured APIs.
* Refresh tokens are rotated.
* Authentication tokens use HTTP-only cookies.
* Role-based authorization is enforced on the backend.
* Activation tokens are one-time and expiring.
* Sensitive configuration is stored in environment variables.


