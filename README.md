# HireDesk

HireDesk is a recruitment-management application for managing candidates,
jobs, interviews, feedback, dashboards, authentication, role-based access
control, and administrator-controlled user onboarding.

The repository contains:

- A NestJS and TypeScript backend.
- A Next.js 16, React 19, TypeScript, and Tailwind CSS frontend.
- PostgreSQL with the Prisma Next ORM contract and checked-in migrations.
- JWT authentication, bcrypt password hashing, refresh-token rotation, and
  role-based authorization.
- Jest/Supertest backend unit and E2E tests.

Docker and Docker Compose are not required for the current local setup.

## Current Project Status

| Area | Status | Notes |
| --- | --- | --- |
| Candidates CRUD | Implemented and locally verified | Search, filtering, sorting, pagination, detail, edit, and delete flows are present. |
| Jobs | Implemented and locally verified | List, filtering, sorting, pagination, detail, update, and delete flows are present. |
| Interviews | Implemented and locally verified | Scheduling form, filters, sorting, CRUD, and pagination are present. |
| Feedback | Implemented and locally verified | Add, edit, delete, dropdowns, and pagination are present. |
| Dashboard | Implemented and locally verified | Counts, recent candidates, and upcoming interviews are provided. |
| JWT authentication | Implemented and locally verified | Register, login, protected routes, and JWT guards are present. |
| Password hashing | Implemented and locally verified | Passwords use bcrypt and are never returned. |
| Refresh tokens | Implemented and locally verified | Refresh-token rotation invalidates the previous token. |
| RBAC | Implemented and locally verified | `ADMIN`, `RECRUITER`, `INTERVIEWER`, and `MENTOR` are supported. |
| User onboarding | Implemented and locally verified | Admin provisioning, role assignment, activation tokens, and activation are present. |
| Pagination | Implemented and locally verified | Users, Interviews, and Feedback use 10-item frontend pagination; Candidates and Jobs use API pagination. |
| Frontend validation and messages | Implemented | Forms show validation, loading, success, and error states. |
| HTTP-only cookies | Implemented and locally verified | Next.js API routes store access and refresh tokens in HTTP-only cookies. |
| Google OAuth | Implemented but externally configured | Code is present; Google Cloud credentials and consent configuration are still required. |
| GitHub Actions CI | Implemented but externally configured | Workflow is present; repository secrets must be added in GitHub. |
| Vercel preparation | Implemented as documentation | Deployment is not completed. |
| CraftedMeal onboarding | Pending | CraftedMeal source or access is not present in this workspace. |
| Mentor demo and assessment | Pending human activity | Code cannot complete the presentation or feedback process. |

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
```

- `backend/src`: NestJS controllers, services, DTOs, guards, and database client.
- `backend/src/prisma`: Prisma Next contract and generated contract types.
- `backend/migrations`: checked-in PostgreSQL schema migrations.
- `backend/scripts/bootstrap-admin.ts`: creates or confirms the first admin.
- `backend/test`: HTTP-level E2E tests.
- `frontend/app`: App Router pages and Next.js API route handlers.
- `frontend/app/api`: server-side proxy routes to the backend.
- `frontend/lib/api-client.ts`: authenticated client requests and refresh retry.
- `frontend/lib/backend.ts`: backend URL configuration.
- `frontend/proxy.ts`: redirects unauthenticated users from protected pages.
- `docs`: internship, OAuth, deployment, and project handoff documentation.
- `.github/workflows/ci.yml`: lint, type-check, build, unit, coverage, and E2E CI.

## Prerequisites

Install:

- A current Node.js release compatible with the installed dependencies. The
  repository does not pin a Node.js version in `package.json`; Node.js 22 was
  used for the latest local verification.
- npm.
- PostgreSQL 15 or newer.
- Git.

PostgreSQL 15 or newer is required by the Prisma Next project documentation.
Docker/Docker Compose is not required for the current local setup.

## Quick Start for Mentor

Follow this order for a fresh local setup:

1. Clone the repository:

   ```bash
   git clone <YOUR_GITHUB_REPOSITORY_URL>
   cd HireDesk
   ```

2. Install backend dependencies:

   ```bash
   cd backend
   npm install
   ```

3. Configure `backend/.env` by copying `backend/.env.example` and setting a
   PostgreSQL `DATABASE_URL`, a private `JWT_SECRET`, and local admin values:

   PowerShell:

   ```powershell
   Copy-Item .env.example .env
   ```

   Bash:

   ```bash
   cp .env.example .env
   ```

4. Start or connect to PostgreSQL.
5. Prepare the configured database from `backend`:

   ```bash
   npx prisma db init
   npx prisma db migrate
   ```

6. Create or confirm the Admin account:

   ```bash
   npm run bootstrap:admin
   ```

7. Start the backend:

   ```bash
   npm run start:dev
   ```

8. In a second terminal, install frontend dependencies:

   ```bash
   cd frontend
   npm install
   ```

9. Start the frontend:

   ```bash
   npm run dev
   ```

10. Open `http://localhost:3000`.
11. Log in at `/login` with the active Admin account configured for the
    database in `backend/.env`.
12. Follow the [manual testing checklist](#manual-mentor-test-checklist).

The migration step must complete before normal backend use, Admin bootstrap, or
backend E2E tests. The backend and bootstrap must use the same `DATABASE_URL`.

## Clone the Repository

Use the repository URL supplied by the project owner:

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd HireDesk
```

## Backend Setup

Open Terminal 1:

```bash
cd backend
npm install
```

Create `backend/.env` by copying `backend/.env.example`.

PowerShell:

```powershell
Copy-Item .env.example .env
```

Bash:

```bash
cp .env.example .env
```

Set `DATABASE_URL` to a PostgreSQL connection string and set a private
`JWT_SECRET`. The backend listens on `PORT` when it is set; the application
default is port `3000`. The current local frontend configuration expects the
backend at `http://localhost:3001`, so use `PORT=3001` in local development if
you want the checked-in frontend configuration to work unchanged.

After completing [Database Setup](#database-setup), start the backend:

```bash
npm run start:dev
```

Backend URLs:

```text
http://localhost:3001  # recommended local PORT configuration
http://localhost:3000  # NestJS default when PORT is not set
```

## Backend Environment Variables

Create these in `backend/.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/hiredesk"
JWT_SECRET="replace-with-a-long-random-secret"
```

The admin bootstrap script also reads:

```env
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="replace-with-a-strong-password"
ADMIN_NAME="HireDesk Admin"
```

Admin-provisioned `RECRUITER`, `INTERVIEWER`, and `MENTOR` accounts also
require SMTP configuration so HireDesk can send their activation email:

```env
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASSWORD=""
SMTP_FROM=""
FRONTEND_URL="http://localhost:3000"
```

`FRONTEND_URL` is used to build the one-time activation link. Do not commit
SMTP credentials. For local testing, provide credentials from an SMTP testing
provider or another SMTP service you are authorized to use. Production email
delivery requires real production SMTP or email-service configuration.

Google OAuth is optional and reads:

```env
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/google/callback"
```

`PORT` is optional. The NestJS application defaults to `3000`; set
`PORT=3001` for the recommended local frontend/backend arrangement.

Never commit `.env`, database credentials, passwords, JWT secrets, OAuth
client secrets, or tokens.

## Database Setup

1. Create or connect to a PostgreSQL 15+ database.
2. Set `DATABASE_URL` in `backend/.env`.
3. Install backend dependencies.
4. From `backend`, initialize Prisma/database configuration when needed:

   ```bash
   npx prisma db init
   ```

5. Apply the required migrations/schema to the configured database:

   ```bash
   npx prisma db migrate
   ```

6. Optionally check the resulting migration status:

   ```bash
   npx prisma migration status
   ```

   `npx prisma migration status` only checks migration status; it does not
   apply migrations. `npx prisma db init` initializes Prisma/database
   configuration when needed. `npx prisma db migrate` applies the required
   migrations/schema to the database configured by `DATABASE_URL`.

   Do not delete or edit existing migrations. The database must be
   initialized/migrated before starting normal backend use, running
   `npm run bootstrap:admin`, or running backend E2E tests.

7. If the contract is changed, regenerate the checked-in contract files:

   ```bash
   npm run contract:emit
   ```

The database contract is configured by `backend/prisma.config.ts` and loads
`.env` through `dotenv/config`.

## First Admin Account

The first administrator is created from the backend bootstrap script, not by
selecting a role on the login page.

The required order is:

```text
Database migration
        ↓
Admin bootstrap
        ↓
Backend startup/use
```

In `backend/.env`, set example values:

```env
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="Use-a-private-demo-password"
ADMIN_NAME="Demo Admin"
```

Then run:

```bash
cd backend
npm run bootstrap:admin
```

Run the bootstrap from `backend` after database migration. It reads
`DATABASE_URL` from `backend/.env`, so it must point to the same database used
by the running backend.

If the email does not exist, the script creates a bcrypt-hashed password and
sets the user to `ADMIN` and `ACTIVE`. If the email already exists, it confirms
the existing account and updates its name, role, and status; it does not reset
the existing password. Therefore, `Admin account confirmed` does not mean that
the supplied password was replaced.

The Admin bootstrap account is created or confirmed separately and does not
use activation email onboarding.

## Internal User Activation Email

The internal-user onboarding flow is:

```text
Admin provisions a RECRUITER, INTERVIEWER, or MENTOR
        ↓
HireDesk sends an activation email
        ↓
User clicks the activation link
        ↓
User sets a password
        ↓
Account becomes ACTIVE
        ↓
User logs in normally
```

The activation email contains a link to `/activate/<token>`. Activation tokens
are hashed before storage, expire, and are invalidated after successful
activation. The raw token is not returned by the provisioning API or shown in
the Admin User Management UI.

If SMTP or `FRONTEND_URL` is not configured, the backend can still start, but
provisioning an internal user fails clearly and the temporary pending user is
rolled back. HireDesk does not pretend that an email was sent and does not
display the token as a fallback.

Candidates remain recruitment records and are not authenticated users. They do
not receive passwords, activation emails, JWTs, refresh tokens, or User
records.

## Frontend Setup

Open Terminal 2:

```bash
cd frontend
npm install
npm run dev
```

The frontend is available at:

```text
http://localhost:3000
```

The frontend server-side API handlers read:

```env
BACKEND_URL=http://localhost:3001
```

from `frontend/.env.local` or the process environment. Set it to the actual
backend origin if the backend uses another port or host.

## Running the Full Application

Terminal 1:

```bash
cd backend
npm install
npm run start:dev
```

Terminal 2:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`, visit `/login`, and log in with an active
HireDesk user.

## Login and Authentication Flow

There is no role selector on the login page. Login uses only email and
password. The role comes from the existing `User` record and is included in
the JWT payload for authorization.

The normal flow is:

1. The login page calls the Next.js `/api/auth/login` route.
2. That route calls backend `POST /auth/login`.
3. The backend verifies the bcrypt password and active status.
4. The frontend stores access and refresh tokens in HTTP-only cookies.
5. Protected frontend requests use Next.js API handlers.
6. A `401` triggers one refresh attempt through `/api/auth/refresh`.
7. If refresh fails, the client redirects to `/login`.
8. Logout deletes both cookies.

Authorization is based on the stored role, not the email address:

| Role | Main access |
| --- | --- |
| `ADMIN` | User management and all protected recruitment features. |
| `RECRUITER` | Candidate CRUD and interview/feedback features allowed by controllers. |
| `INTERVIEWER` | Interview and feedback features. |
| `MENTOR` | Candidate read access and candidate creation/update/delete restrictions as defined by controller roles. |

The exact backend role guards are the source of truth. `JwtAuthGuard`
authenticates tokens and `RolesGuard` enforces `@Roles()` declarations.

## User Onboarding Workflow

1. An admin logs in.
2. The admin opens `/users`.
3. The admin provisions a user.
4. The admin assigns `ADMIN`, `RECRUITER`, `INTERVIEWER`, or `MENTOR`.
5. HireDesk sends an activation email to a `RECRUITER`, `INTERVIEWER`, or
   `MENTOR`.
6. The invited user opens `/activate/<token>` from the email.
7. The invited user sets a password.
8. The account becomes `ACTIVE`.
9. The user logs in through `/login`.
10. Backend guards use the assigned role.

Email delivery uses the reusable SMTP email service in this repository.
SMTP configuration is required for provisioning these internal users, and
activation links must be handled securely. A new user does not choose an admin
or recruiter role during login.

## Main Frontend Routes

| Route | Purpose |
| --- | --- |
| `/login` | Email/password login and optional Google login. |
| `/` | Candidate list and management page. |
| `/candidates/[id]` | Candidate detail. |
| `/candidates/[id]/edit` | Candidate edit form. |
| `/jobs` | Job list with filtering, sorting, and pagination. |
| `/jobs/[id]` | Job detail/edit page. |
| `/interviews` | Interview scheduling, filters, CRUD, and pagination. |
| `/interviews/[id]` | Interview detail. |
| `/feedback` | Feedback form, CRUD, dropdowns, and pagination. |
| `/dashboard` | Dashboard counts and recent/upcoming data. |
| `/users` | Admin-only user provisioning and management. |
| `/activate/[token]` | Account activation and password setup. |

## Main Backend API

All paths below are relative to the backend origin.

### Authentication

| Method and path | Purpose | Auth |
| --- | --- | --- |
| `POST /auth/register` | Register a user. | Public |
| `POST /auth/login` | Return access and refresh tokens. | Public |
| `POST /auth/refresh` | Rotate the refresh token. | Refresh token |
| `POST /auth/activate` | Activate an invited user. | Activation token |
| `GET /auth/me` | Return the authenticated JWT subject. | JWT |
| `GET /auth/google` | Return a Google authorization URL. | Public; OAuth config required |
| `GET /auth/google/callback` | Exchange Google code and issue HireDesk tokens. | Public; OAuth config required |

### Candidates

| Method and path | Purpose | Auth/roles |
| --- | --- | --- |
| `GET /candidates` | List candidates with page, limit, search, job, and sort query parameters. | JWT |
| `GET /candidates/:id` | Retrieve a candidate. | JWT |
| `POST /candidates` | Create a candidate. | `ADMIN`, `RECRUITER` |
| `PUT /candidates/:id` | Update a candidate. | `ADMIN`, `RECRUITER` |
| `DELETE /candidates/:id` | Delete a candidate. | `ADMIN`, `RECRUITER` |
| `GET /candidates/health` | Candidate module health. | JWT guard applies |

### Jobs

| Method and path | Purpose | Auth/roles |
| --- | --- | --- |
| `GET /jobs` | List jobs with page, limit, search, status, and sort query parameters. | Public backend endpoint |
| `GET /jobs/:id` | Retrieve a job. | Public backend endpoint |
| `POST /jobs` | Create a job. | Public backend endpoint |
| `PUT /jobs/:id` | Update a job. | Public backend endpoint |
| `DELETE /jobs/:id` | Delete a job. | Public backend endpoint |
| `GET /jobs/health` | Jobs module health. | Public backend endpoint |

### Interviews

| Method and path | Purpose | Auth/roles |
| --- | --- | --- |
| `GET /interviews` | List interviews with status and sort query parameters. | `ADMIN`, `RECRUITER`, `INTERVIEWER` |
| `POST /interviews` | Schedule an interview. | `ADMIN`, `RECRUITER`, `INTERVIEWER` |
| `PUT /interviews/:id` | Update an interview. | `ADMIN`, `RECRUITER`, `INTERVIEWER` |
| `DELETE /interviews/:id` | Delete an interview. | `ADMIN`, `RECRUITER`, `INTERVIEWER` |
| `GET /interviews/health` | Interviews module health. | Same controller guard |

### Feedback

| Method and path | Purpose | Auth/roles |
| --- | --- | --- |
| `GET /feedback` | List feedback. | `ADMIN`, `RECRUITER`, `INTERVIEWER` |
| `POST /feedback` | Create feedback. | `ADMIN`, `RECRUITER`, `INTERVIEWER` |
| `GET /feedback/:id` | Retrieve feedback. | `ADMIN`, `RECRUITER`, `INTERVIEWER` |
| `PUT /feedback/:id` | Update feedback. | `ADMIN`, `RECRUITER`, `INTERVIEWER` |
| `DELETE /feedback/:id` | Delete feedback. | `ADMIN`, `RECRUITER`, `INTERVIEWER` |
| `GET /feedback/health` | Feedback module health. | Same controller guard |

### Dashboard and users

| Method and path | Purpose | Auth/roles |
| --- | --- | --- |
| `GET /health` | Backend health. | Public |
| `GET /dashboard` | Counts, recent candidates, and upcoming interviews. | JWT |
| `GET /users` | List users without password/token fields. | `ADMIN` |
| `POST /users` | Provision a pending user and send an activation email. | `ADMIN` |
| `PUT /users/:id` | Change another user's role or status. | `ADMIN` |

## Testing

Run these commands from the indicated directory.

Backend unit tests:

```bash
cd backend
npm test -- --runInBand
```

Backend unit tests with coverage gate:

```bash
npm run test:cov -- --runInBand
```

Backend E2E tests:

```bash
cd backend
npm run test:e2e -- --runInBand
```

Before running backend E2E tests, ensure PostgreSQL is running and reachable,
`DATABASE_URL` is valid, the required schema/migrations have been applied to
that database, and the required backend environment variables are configured.
The current tests do not require separate invented seed data; they use the
configured application database and their existing test setup.

Frontend lint:

```bash
cd frontend
npm run lint
```

Frontend TypeScript diagnostics:

```bash
npx tsc --noEmit
```

Frontend production build:

```bash
npm run build
```

The latest local verification for this repository was:

- Backend unit tests: **121 passing** across 13 suites.
- Backend E2E tests: **30 passing**.
- Backend coverage: **68.21% statements, 65.33% branches, 71.15% functions, 68.39% lines**, passing the configured gate.
- Frontend lint: **passed**.
- Frontend TypeScript check: **passed**.
- Frontend production build: **passed**.
- `git diff --check`: **passed**.

The E2E runner prints an existing Jest open-handle warning after the tests
finish, but all 30 tests pass.

## Manual Mentor Test Checklist

### Authentication

- [ ] Create or confirm a demo admin with `npm run bootstrap:admin`.
- [ ] Start backend and frontend.
- [ ] Log in at `/login`.
- [ ] Open `/dashboard`.
- [ ] Log out.
- [ ] Try an invalid password and confirm it is rejected.
- [ ] Open a protected route while logged out and confirm redirect to `/login`.

### User onboarding

- [ ] Open `/users` as an admin.
- [ ] Provision a `RECRUITER`.
- [ ] Verify the new account is `PENDING`.
- [ ] Confirm the activation email was delivered.
- [ ] Open the activation link from the email and set a password.
- [ ] Log in as the activated recruiter.
- [ ] Verify recruiter access to permitted recruitment features.
- [ ] Verify a non-admin cannot use `/users`.

### Candidates

- [ ] Create a candidate.
- [ ] Search or filter candidates.
- [ ] Open candidate details.
- [ ] Edit the candidate.
- [ ] Delete the candidate if appropriate.

### Jobs

- [ ] View jobs.
- [ ] Test filtering, sorting, and pagination.
- [ ] Open and edit a job.

### Interviews

- [ ] Schedule an interview.
- [ ] Test status filtering and sorting.
- [ ] Edit and delete an interview.
- [ ] Test pagination.
- [ ] Confirm dropdown selected text and options are readable.

### Feedback

- [ ] Add feedback.
- [ ] Edit feedback.
- [ ] Delete feedback.
- [ ] Test pagination.
- [ ] Confirm interview and rating dropdowns are readable.

### Dashboard

- [ ] Verify candidate, job, interview, and feedback counts.
- [ ] Verify recent candidates.
- [ ] Verify upcoming scheduled interviews.

## Pagination

Current pagination:

- Users: frontend pagination, 10 users per page.
- Interviews: frontend pagination, 10 interviews per page.
- Feedback: frontend pagination, 10 feedback records per page.
- Candidates: backend/API pagination, default limit 5.
- Jobs: backend/API pagination, default limit 5.

Each paginated frontend list has a page indicator and Previous/Next buttons.

## Google OAuth

Google OAuth code/scaffolding is implemented but **requires external Google
Cloud configuration before testing**.

Backend variables:

```env
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/google/callback"
```

Setup:

1. Create or select a Google Cloud project.
2. Configure the OAuth consent screen.
3. Create a Web OAuth client.
4. Add the exact redirect URI above.
5. Put the client ID and secret in `backend/.env`.
6. Ensure the Google email already belongs to an active HireDesk user.

Do not commit the client secret. OAuth does not silently create users or assign
roles. Production requires a production callback URL and production secrets.

## GitHub Actions / CI

`.github/workflows/ci.yml` runs on pushes to `main` and pull requests. It:

- Installs backend and frontend dependencies with `npm ci`.
- Runs frontend lint.
- Runs frontend TypeScript diagnostics.
- Builds the frontend.
- Runs backend unit tests with coverage.
- Runs backend E2E tests.

Configure these GitHub repository secrets for the E2E job:

```text
DATABASE_URL
JWT_SECRET
```

The current workflow does not provision PostgreSQL and does not automatically
create or apply a database schema. Therefore, the configured CI
`DATABASE_URL` must point to a reachable, usable database with the required
schema/migrations already applied. The workflow itself is unchanged by this
documentation.

Docker build and Docker Compose steps are intentionally not included.

## Deployment / Vercel

Deployment preparation is complete; production deployment is not completed.

Vercel is for the Next.js frontend only. The NestJS backend needs separate
hosting, and PostgreSQL needs a reachable database service.

Recommended frontend deployment:

1. Create a Vercel project using the repository.
2. Set the project root to `frontend`.
3. Set `BACKEND_URL` to the deployed HTTPS backend origin.
4. Deploy the frontend.
5. Host the backend separately and configure it with `DATABASE_URL`,
   `JWT_SECRET`, and optional Google OAuth variables.
6. Provide a reachable production PostgreSQL service and ensure the backend's
   `DATABASE_URL` points to it.
7. Update `GOOGLE_REDIRECT_URI` if Google OAuth is used.

Production environment variables must point to the correct deployed backend
and database services. No production deployment or account setup has been
performed.

Production smoke test:

- Login and invalid-login rejection.
- Protected route redirect.
- Refresh and logout.
- Candidate, interview, and feedback CRUD.
- User onboarding and role restrictions.
- Backend health endpoint.
- Rejected unauthenticated API request.

## Troubleshooting

### Port already in use

Set a different `PORT` for the backend and update frontend `BACKEND_URL`, or
stop the process using the configured port.

### Frontend cannot reach backend

Confirm the backend is running, confirm its port, and ensure
`frontend/.env.local` contains the matching `BACKEND_URL`. Restart the
frontend after changing environment variables.

### Invalid email or password

Confirm the email exists, the account is `ACTIVE`, and the password matches.
The bootstrap message `Admin account confirmed` can refer to an existing
account and does not necessarily mean its password was reset.

### Database connection failure

Confirm PostgreSQL is running, `DATABASE_URL` is valid, and the database user
has access to the named database.

### Migration or contract problems

Run `npx prisma migration status` from `backend`. Do not delete migrations.
If the contract was intentionally changed, run `npm run contract:emit`.

### Missing environment variables

Copy `.env.example` to `.env`, fill placeholders, and restart the relevant
process. Never paste secrets into source files or README.md.

### Admin bootstrap problems

Run the command from `backend` and confirm `DATABASE_URL` points to the same
database used by the running backend. Existing accounts may need their
password reset through an approved account-management process; rerunning the
current bootstrap command does not reset an existing password.

### OAuth configuration problems

Confirm the three Google variables, the exact redirect URI, the OAuth consent
screen, allowed test users, and that the Google email belongs to an active
HireDesk user.

## Security Notes

- Do not commit `.env` files.
- Do not commit database credentials, JWT secrets, Google OAuth secrets,
  passwords, or tokens.
- Passwords are hashed with bcrypt.
- Refresh-token digests are hashed before storage.
- HTTP-only cookies are used for frontend token storage.
- Activation tokens are one-time and expiring; handle them securely.
- Production secrets must be provided through environment variables.
- Do not use email address as a substitute for role authorization.

## Demo Flow

Suggested 10-minute demo:

1. Log in as admin.
2. Show the dashboard.
3. Open User Management.
4. Provision a recruiter.
5. Explain assigned role and pending status.
6. Activate the recruiter account.
7. Log in as recruiter.
8. Show role-based access restrictions.
9. Demonstrate Candidates, Interviews, and Feedback.
10. Demonstrate pagination and readable dropdowns.
11. Show test and CI commands.
12. Briefly explain the frontend/API/backend/database architecture.

The actual demo and mentor feedback remain human activities.

## Known Limitations and Pending Items

- Google OAuth requires Google Cloud configuration and real environment
  variables.
- GitHub Actions requires repository secrets.
- Vercel deployment has not been performed.
- CraftedMeal is not present or accessible in this workspace, so no API
  contract has been invented.
- A mentor/customer must assign the first real feature.
- Demo presentation, mentor feedback, and assessment are not code-completable.
- Docker/Docker Compose is intentionally skipped.
- Pull-request and peer-review activities are intentionally skipped.

## Development Guidelines

For a new collaborator:

1. Create a working branch when appropriate.
2. Install backend and frontend dependencies.
3. Configure local environment files.
4. Run the backend and frontend locally.
5. Run the targeted tests before and after changes.
6. Run the complete lint, type-check, build, unit, E2E, and diff checks before
   submitting work.
7. Keep secrets out of source control.

## Additional Documentation

- [Internship plan audit and deployment guide](docs/INTERNSHIP_PLAN.md)
- [Backend README](backend/README.md)
- [Prisma Next project notes](backend/prisma-next.md)
- [Database ERD](backend/docs/ERD.md)
- [GitHub Actions workflow](.github/workflows/ci.yml)
