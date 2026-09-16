# HireDesk

## 1. Project Overview

HireDesk is a recruitment management application for tracking candidates, jobs, interviews, and interview feedback. It includes a Next.js frontend and a NestJS backend backed by PostgreSQL.

## Production URLs

- Frontend: [https://hiredesk-kappa.vercel.app](https://hiredesk-kappa.vercel.app)
- User Management: [https://hiredesk-kappa.vercel.app/users](https://hiredesk-kappa.vercel.app/users)
- Backend: [https://hiredesk-yesm.onrender.com](https://hiredesk-yesm.onrender.com)
- Backend Health: [https://hiredesk-yesm.onrender.com/health](https://hiredesk-yesm.onrender.com/health)

### Important Frontend Routes

- `/login`
- `/dashboard`
- `/candidates`
- `/jobs`
- `/interviews`
- `/feedback`
- `/users`

## 2. Key Features

- Candidate recruitment records with search, sorting, pagination, and job assignment.
- Job creation and management.
- Interview scheduling and status management.
- Interview feedback management.
- JWT authentication with role-based access control.
- Administrator-provisioned users with email activation.
- Google sign-in support when configured.
- Dashboard summaries for candidates, jobs, interviews, and feedback.

Candidates are recruitment records, not authenticated users.

Activation emails use the Brevo transactional email HTTPS API. Activation links expire after 24 hours and can be used only once.

## 3. Tech Stack

- Frontend: Next.js, React, TypeScript, Tailwind CSS
- Backend: NestJS, TypeScript
- Database: PostgreSQL
- ORM/database access: Prisma ORM Postgres adapter
- Authentication: JWT, bcryptjs, optional Google OAuth
- Email: Brevo transactional email HTTPS API

## 4. Project Structure

```text
backend/       NestJS API, authentication, database access, tests, migrations
frontend/      Next.js application and API proxy routes
docs/          Project documentation
```

## 5. Environment Variables

Copy `backend/.env.example` to `backend/.env` and set the required values. Never commit real credentials.

### Backend

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string. |
| `JWT_SECRET` | Secret used to sign JWTs. |
| `FRONTEND_URL` | Frontend base URL used in activation links. |
| `ADMIN_EMAIL` | Email for `bootstrap:admin`. |
| `ADMIN_PASSWORD` | Password for `bootstrap:admin`. |
| `ADMIN_NAME` | Display name for `bootstrap:admin`. |
| `BREVO_API_KEY` | Brevo API key for activation emails. |
| `BREVO_FROM` | Verified Brevo sender email address. |

Google sign-in also requires `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REDIRECT_URI`.

The frontend can use `BACKEND_URL` to set the backend address. Its local default is `http://localhost:3001`.

## 6. Local Setup / Running the Project

Install dependencies in both applications:

```bash
cd backend
npm install

cd ../frontend
npm install
```

Configure `backend/.env` using the variables above and make sure PostgreSQL is available. Then run the applications in separate terminals:

```bash
# Backend, from backend/
npm run start:dev

# Frontend, from frontend/
npm run dev
```

Local URLs:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001` when `PORT=3001` is configured; otherwise Nest uses its default port.

To create the initial administrator with the configured admin variables:

```bash
cd backend
npm run bootstrap:admin
```

## 7. Authentication and Roles

Users authenticate with email/password or optional Google sign-in. The backend returns JWT access and refresh tokens. Administrator-provisioned users receive a Brevo activation email before setting their password.

Available roles:

- `ADMIN`: user and organization administration.
- `RECRUITER`: candidate, job, and recruitment workflow access.
- `INTERVIEWER`: interviews and feedback.
- `MENTOR`: application role supported by the user model.

Pending users must activate their account before login. Disabled users cannot log in.

## 8. Main API/Frontend Routes

### Backend API

- `/auth`: register, login, refresh, activation, current user, and Google OAuth.
- `/users`: administrator-only user provisioning and user management.
- `/candidates`: candidate records.
- `/jobs`: job records.
- `/interviews`: interview records.
- `/feedback`: interview feedback.
- `/dashboard`: authenticated dashboard summary.
- `/health`: backend health check.

Resource endpoints support the CRUD operations implemented by each controller. Protected endpoints require a JWT and, where configured, an allowed role.

### Frontend

- `/login`
- `/activate/[token]`
- `/` candidate list
- `/candidates/[id]` candidate details
- `/candidates/[id]/edit` candidate editing
- `/dashboard`
- `/jobs` and `/jobs/[id]`
- `/interviews` and `/interviews/[id]`
- `/feedback`
- `/users`

The frontend proxies API requests through its `/api` routes and forwards the access token to the backend.

## 9. Testing

From `backend/`:

```bash
npm test
npm run test:e2e
npm run test:cov
```

From `frontend/`:

```bash
npm run lint
npm run build
```

## 10. Deployment

Deploy the frontend and backend as separate applications. Configure the environment variables in the hosting provider rather than committing `.env` files. Set `FRONTEND_URL` to the deployed frontend URL, `BACKEND_URL` on the frontend to the deployed backend URL, and configure the Brevo API key and verified sender.

No deployed frontend or backend URLs are currently documented in this repository.

## 11. Known Limitations

- The application requires a reachable PostgreSQL database.
- Google sign-in requires separate Google OAuth configuration.
- Email activation requires a verified Brevo sender and valid Brevo credentials.
- The backend E2E tests require the configured database to be reachable.
