# HireDesk Internship Plan Audit

This audit reflects the repository state on 2026-09-11. Human activities are
not marked complete by code.

| Day | Requirement | Already Done | Missing | Can Copilot Complete? | Human Action Required |
| --- | --- | --- | --- | --- | --- |
| 10 | Estimate, subtasks, implementation, tests | Existing feature work and tests establish the pattern | A task-specific estimate is not recorded | Partly: code and tests | Select and approve the assigned task |
| 11 | Next.js basics and API integration | App Router, TypeScript, Tailwind, layout, navigation, environment config, API client | No material gap found | Yes, already complete | Confirm the app locally |
| 12 | Data pages, detail pages, loading and error states | Candidates, jobs, interviews, feedback and dashboard pages provide these states | No material gap found | Yes, already complete | Manual UX review |
| 13 | Authentication and protected routes | Login, HTTP-only cookies, route protection, refresh and logout are implemented | Full browser login test is not automated | Partly | Run a manual end-to-end login test |
| 14 | Interview and feedback UI | Forms, validation, success/error handling and API routes exist | No material gap found | Yes, already complete | Verify against a live environment |
| 15 | Small real feature | Pagination and onboarding are implemented | No separately assigned feature is recorded | Partly | Select and approve the feature |
| 16 | Google OAuth | Environment-safe OAuth flow and account linking by verified email are implemented | Google Cloud project, consent screen and credentials are not configured | Yes, code is prepared | Create/configure Google credentials |
| 17 | CI and quality | Local lint, type-check, build, unit and E2E commands exist | GitHub Actions workflow was missing | Yes | Enable/inspect repository Actions |
| 18 | Vercel/deployment preparation | Frontend is a Next.js app and uses `BACKEND_URL` | Deployment and smoke-test documentation was missing | Yes | Create Vercel/project accounts and deploy manually |
| 19 | First real feature | Existing modules provide extension points | No real assigned feature exists | No, not honestly | Mentor/customer assigns the feature |
| 20 | Demo and assessment preparation | Existing README documents architecture and tests | Demo script, learning summary and assessment template were missing | Yes | Present the demo and receive feedback |
| 21 | CraftedMeal onboarding | CraftedMeal is not present in this workspace | API and screen contract inspection cannot be performed | No | Provide repository/access and mentor context |

## Google OAuth setup

Set these backend variables without committing them:

```env
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/google/callback"
```

In Google Cloud Console, create an OAuth 2.0 Web application, configure the
redirect URI exactly, configure the consent screen, and add test users if the
application is not published. The Google email must already belong to an
active HireDesk user; OAuth does not silently create accounts or assign roles.

For production, use the deployed frontend callback URL and set the same
`GOOGLE_REDIRECT_URI` in the backend environment.

## Deployment preparation

1. Deploy `frontend` as a Vercel project with the repository root set to
   `frontend`.
2. Set `BACKEND_URL` to the HTTPS backend origin.
3. Configure the backend separately with `DATABASE_URL`, `JWT_SECRET`, and
   optional Google OAuth variables.
4. Configure the Google redirect URI for the deployed frontend.
5. Run the smoke-test checklist: login, refresh, logout, protected route,
   candidate CRUD, interview CRUD, feedback CRUD, user management, and a
   rejected unauthenticated request.

No deployment or account configuration is performed by this repository change.

## Demo and assessment preparation

Suggested demo order: login, dashboard, candidate/job workflow, interview
scheduling, feedback, admin onboarding and role management, then refresh/logout.

What-I-learned prompts: API layering, typed client/server boundaries, JWT
rotation, RBAC, PostgreSQL contracts, validation, and test strategy.

Assessment prompts: strengths, unresolved risks, next feature, deployment
readiness, and mentor feedback.

## CraftedMeal status

No CraftedMeal source, URL, API specification, or workspace was available.
This repository therefore contains no invented CraftedMeal endpoints or
request/response claims.
