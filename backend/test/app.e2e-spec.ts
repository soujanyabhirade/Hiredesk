/// <reference types="jest" />

import {
  describe,
  it,
  expect,
  jest,
  beforeAll,
  afterAll,
} from '@jest/globals';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcryptjs';
import { createHash } from 'node:crypto';

import { AppModule } from '../src/app.module.js';
import { db } from '../src/prisma/db.js';
import { EmailService } from '../src/email/email.service.js';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule =
      await Test.createTestingModule({
        imports: [AppModule],
      })
        .overrideProvider(EmailService)
        .useValue({
          sendActivationEmail: jest.fn().mockResolvedValue(undefined),
        })
        .compile();

    app = moduleFixture.createNestApplication();

    process.env['FRONTEND_URL'] = 'http://localhost:3000';
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/ (GET)', async () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200);
  });

  it('/auth/register (POST)', async () => {
    const email =
      `e2e-register-${Date.now()}@example.com`;

    return request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email,
        password: 'TestPassword123!',
      })
      .expect(201)
      .expect((response) => {
        expect(response.body.id).toBeDefined();
        expect(response.body.email).toBe(email);
        expect(response.body.password).toBeUndefined();
      });
  });

  it('/auth/login (POST) with valid credentials', async () => {
    const email =
      `e2e-login-${Date.now()}@example.com`;

    const password = 'TestPassword123!';

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email,
        password,
      })
      .expect(201);

    return request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email,
        password,
      })
      .expect(201)
      .expect((response) => {
        expect(response.body.access_token).toBeDefined();
        expect(response.body.refresh_token).toBeDefined();
        expect(response.body.password).toBeUndefined();
      });
  });

  it('/auth/login (POST) with invalid password', async () => {
    const email =
      `e2e-login-invalid-${Date.now()}@example.com`;

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email,
        password: 'CorrectPassword123!',
      })
      .expect(201);

    return request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email,
        password: 'WrongPassword123!',
      })
      .expect(401);
  });

  it('/auth/refresh (POST) with valid refresh token', async () => {
    const email =
      `e2e-refresh-${Date.now()}@example.com`;

    const password = 'TestPassword123!';

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email,
        password,
      })
      .expect(201);

    const loginResponse =
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email,
          password,
        })
        .expect(201);

    const refreshToken =
      loginResponse.body.refresh_token;

    expect(refreshToken).toBeDefined();

    return request(app.getHttpServer())
      .post('/auth/refresh')
      .send({
        refresh_token: refreshToken,
      })
      .expect(201)
      .expect((response) => {
        expect(response.body.access_token).toBeDefined();
        expect(response.body.refresh_token).toBeDefined();
      });
  });

  it('/auth/refresh (POST) with invalid refresh token', async () => {
    return request(app.getHttpServer())
      .post('/auth/refresh')
      .send({
        refresh_token: 'invalid-refresh-token',
      })
      .expect(401);
  });

  it('/candidates (GET) without authentication', async () => {
    return request(app.getHttpServer())
      .get('/candidates')
      .expect(401);
  });

  it('/candidates (GET) with authentication', async () => {
    const email =
      `e2e-candidate-get-${Date.now()}@example.com`;

    const password = 'TestPassword123!';

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email,
        password,
      })
      .expect(201);

    const loginResponse =
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email,
          password,
        })
        .expect(201);

    const accessToken =
      loginResponse.body.access_token;

    return request(app.getHttpServer())
      .get('/candidates')
      .set(
        'Authorization',
        `Bearer ${accessToken}`,
      )
      .expect(200)
      .expect((response) => {
        expect(response.body).toHaveProperty('data');
        expect(
          Array.isArray(response.body.data),
        ).toBe(true);

        expect(response.body).toHaveProperty('page');
        expect(response.body).toHaveProperty('limit');
        expect(response.body).toHaveProperty('search');
        expect(response.body).toHaveProperty('jobId');
        expect(response.body).toHaveProperty('sort');
        expect(response.body).toHaveProperty('total');
      });
  });

  it('/candidates (POST) with MENTOR role', async () => {
    const email =
      `e2e-mentor-${Date.now()}@example.com`;

    const password = 'TestPassword123!';

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email,
        password,
      })
      .expect(201);

    await db.orm.public.User
      .where({
        email,
      })
      .update({
        role: 'MENTOR',
      });

    const loginResponse =
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email,
          password,
        })
        .expect(201);

    return request(app.getHttpServer())
      .post('/candidates')
      .set(
        'Authorization',
        `Bearer ${loginResponse.body.access_token}`,
      )
      .send({
        name: 'Mentor Test Candidate',
        email: `candidate-${Date.now()}@example.com`,
        jobId: 1,
      })
      .expect(403);
  });

  it('/candidates (POST) with RECRUITER role', async () => {
    const email =
      `e2e-recruiter-${Date.now()}@example.com`;

    const password = 'TestPassword123!';

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email,
        password,
      })
      .expect(201);

    await db.orm.public.User
      .where({
        email,
      })
      .update({
        role: 'RECRUITER',
      });

    const loginResponse =
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email,
          password,
        })
        .expect(201);

    return request(app.getHttpServer())
      .post('/candidates')
      .set(
        'Authorization',
        `Bearer ${loginResponse.body.access_token}`,
      )
      .send({
        name: 'Recruiter Test Candidate',
        email: `candidate-${Date.now()}@example.com`,
        jobId: 1,
      })
      .expect(201);
  });

  it('/candidates (PUT) with MENTOR role', async () => {
    const candidate =
      await db.orm.public.Candidate.create({
        name: 'Candidate PUT Mentor Test',
        email: `candidate-put-mentor-${Date.now()}@example.com`,
        jobId: 1,
      });

    const email =
      `e2e-candidate-put-mentor-${Date.now()}@example.com`;

    const password = 'TestPassword123!';

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email,
        password,
      })
      .expect(201);

    await db.orm.public.User
      .where({
        email,
      })
      .update({
        role: 'MENTOR',
      });

    const loginResponse =
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email,
          password,
        })
        .expect(201);

    return request(app.getHttpServer())
      .put(`/candidates/${candidate.id}`)
      .set(
        'Authorization',
        `Bearer ${loginResponse.body.access_token}`,
      )
      .send({
        name: 'Updated by Mentor',
      })
      .expect(403);
  });

  it('/candidates (PUT) with RECRUITER role', async () => {
    const candidate =
      await db.orm.public.Candidate.create({
        name: 'Candidate PUT Recruiter Test',
        email: `candidate-put-recruiter-${Date.now()}@example.com`,
        jobId: 1,
      });

    const email =
      `e2e-candidate-put-recruiter-${Date.now()}@example.com`;

    const password = 'TestPassword123!';

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email,
        password,
      })
      .expect(201);

    await db.orm.public.User
      .where({
        email,
      })
      .update({
        role: 'RECRUITER',
      });

    const loginResponse =
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email,
          password,
        })
        .expect(201);

    return request(app.getHttpServer())
      .put(`/candidates/${candidate.id}`)
      .set(
        'Authorization',
        `Bearer ${loginResponse.body.access_token}`,
      )
      .send({
        name: 'Updated by Recruiter',
      })
      .expect(200)
      .expect((response) => {
        expect(response.body).toBeDefined();
      });
  });

  it('/candidates (DELETE) with MENTOR role', async () => {
    const candidate =
      await db.orm.public.Candidate.create({
        name: 'Candidate DELETE Mentor Test',
        email: `candidate-delete-mentor-${Date.now()}@example.com`,
        jobId: 1,
      });

    const email =
      `e2e-candidate-delete-mentor-${Date.now()}@example.com`;

    const password = 'TestPassword123!';

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email,
        password,
      })
      .expect(201);

    await db.orm.public.User
      .where({
        email,
      })
      .update({
        role: 'MENTOR',
      });

    const loginResponse =
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email,
          password,
        })
        .expect(201);

    return request(app.getHttpServer())
      .delete(`/candidates/${candidate.id}`)
      .set(
        'Authorization',
        `Bearer ${loginResponse.body.access_token}`,
      )
      .expect(403);
  });

  it('/candidates (DELETE) with RECRUITER role', async () => {
    const candidate =
      await db.orm.public.Candidate.create({
        name: 'Candidate DELETE Recruiter Test',
        email: `candidate-delete-recruiter-${Date.now()}@example.com`,
        jobId: 1,
      });

    const email =
      `e2e-candidate-delete-recruiter-${Date.now()}@example.com`;

    const password = 'TestPassword123!';

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email,
        password,
      })
      .expect(201);

    await db.orm.public.User
      .where({
        email,
      })
      .update({
        role: 'RECRUITER',
      });

    const loginResponse =
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email,
          password,
        })
        .expect(201);

    return request(app.getHttpServer())
      .delete(`/candidates/${candidate.id}`)
      .set(
        'Authorization',
        `Bearer ${loginResponse.body.access_token}`,
      )
      .expect(200)
      .expect((response) => {
        expect(response.body.message).toContain(
          'deleted successfully',
        );
      });
  });

  it('/interviews (GET) without authentication', async () => {
    return request(app.getHttpServer())
      .get('/interviews')
      .expect(401);
  });

  it('/interviews (GET) with INTERVIEWER role', async () => {
    const email =
      `e2e-interviewer-${Date.now()}@example.com`;

    const password = 'TestPassword123!';

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email,
        password,
      })
      .expect(201);

    await db.orm.public.User
      .where({
        email,
      })
      .update({
        role: 'INTERVIEWER',
      });

    const loginResponse =
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email,
          password,
        })
        .expect(201);

    return request(app.getHttpServer())
      .get('/interviews')
      .set(
        'Authorization',
        `Bearer ${loginResponse.body.access_token}`,
      )
      .expect(200)
      .expect((response) => {
        expect(Array.isArray(response.body)).toBe(true);
      });
  });

  it('/interviews (POST) with status', async () => {
    const candidate =
      await db.orm.public.Candidate.create({
        name: 'Interview E2E Candidate',
        email: `interview-candidate-${Date.now()}@example.com`,
        jobId: 1,
      });

    const email =
      `e2e-interview-create-${Date.now()}@example.com`;

    const password = 'TestPassword123!';

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email,
        password,
      })
      .expect(201);

    await db.orm.public.User
      .where({
        email,
      })
      .update({
        role: 'INTERVIEWER',
      });

    const loginResponse =
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email,
          password,
        })
        .expect(201);

    return request(app.getHttpServer())
      .post('/interviews')
      .set(
        'Authorization',
        `Bearer ${loginResponse.body.access_token}`,
      )
      .send({
        candidateId: candidate.id,
        scheduledAt: '2026-09-15T10:00:00.000Z',
        status: 'SCHEDULED',
      })
      .expect(201)
      .expect((response) => {
        expect(response.body.id).toBeDefined();
        expect(response.body.candidateId).toBe(
          candidate.id,
        );
        expect(response.body.status).toBe(
          'SCHEDULED',
        );
      });
  });

  it('/interviews (POST) without status', async () => {
    const candidate =
      await db.orm.public.Candidate.create({
        name: 'Interview E2E Candidate Without Status',
        email: `interview-candidate-no-status-${Date.now()}@example.com`,
        jobId: 1,
      });

    const email =
      `e2e-interview-create-no-status-${Date.now()}@example.com`;

    const password = 'TestPassword123!';

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email,
        password,
      })
      .expect(201);

    await db.orm.public.User
      .where({
        email,
      })
      .update({
        role: 'INTERVIEWER',
      });

    const loginResponse =
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email,
          password,
        })
        .expect(201);

    return request(app.getHttpServer())
      .post('/interviews')
      .set(
        'Authorization',
        `Bearer ${loginResponse.body.access_token}`,
      )
      .send({
        candidateId: candidate.id,
        scheduledAt: '2026-09-16T10:00:00.000Z',
      })
      .expect(201)
      .expect((response) => {
        expect(response.body.id).toBeDefined();
        expect(response.body.candidateId).toBe(
          candidate.id,
        );
        expect(response.body.status).toBe(
          'SCHEDULED',
        );
      });
  });

  it('/feedback (GET) without authentication', async () => {
    return request(app.getHttpServer())
      .get('/feedback')
      .expect(401);
  });

  it('/feedback (GET) with INTERVIEWER role', async () => {
    const email =
      `e2e-feedback-interviewer-${Date.now()}@example.com`;

    const password = 'TestPassword123!';

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email,
        password,
      })
      .expect(201);

    await db.orm.public.User
      .where({
        email,
      })
      .update({
        role: 'INTERVIEWER',
      });

    const loginResponse =
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email,
          password,
        })
        .expect(201);

    return request(app.getHttpServer())
      .get('/feedback')
      .set(
        'Authorization',
        `Bearer ${loginResponse.body.access_token}`,
      )
      .expect(200)
      .expect((response) => {
        expect(Array.isArray(response.body)).toBe(true);
      });
  });

  it('/feedback/health (GET) with INTERVIEWER role', async () => {
    const email =
      `e2e-feedback-health-${Date.now()}@example.com`;

    const password = 'TestPassword123!';

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email,
        password,
      })
      .expect(201);

    await db.orm.public.User
      .where({
        email,
      })
      .update({
        role: 'INTERVIEWER',
      });

    const loginResponse =
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email,
          password,
        })
      .expect(201);

    return request(app.getHttpServer())
      .get('/feedback/health')
      .set(
        'Authorization',
        `Bearer ${loginResponse.body.access_token}`,
      )
      .expect(200)
      .expect({
        status: 'ok',
        module: 'feedback',
      });
  });

  it('/feedback (POST) with comments', async () => {
    const job =
      await db.orm.public.Job.create({
        title: 'Feedback E2E Job',
        description: 'Job for feedback E2E test',
        location: 'Bangalore',
      });

    const candidate =
      await db.orm.public.Candidate.create({
        name: 'Feedback E2E Candidate',
        email: `feedback-candidate-${Date.now()}@example.com`,
        jobId: job.id,
      });

    const interview =
      await db.orm.public.Interview.create({
        candidateId: candidate.id,
        scheduledAt: '2026-09-17T10:00:00.000Z',
        status: 'SCHEDULED',
      });

    const email =
      `e2e-feedback-create-${Date.now()}@example.com`;

    const password = 'TestPassword123!';

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email,
        password,
      })
      .expect(201);

    await db.orm.public.User
      .where({
        email,
      })
      .update({
        role: 'INTERVIEWER',
      });

    const loginResponse =
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email,
          password,
        })
      .expect(201);

    return request(app.getHttpServer())
      .post('/feedback')
      .set(
        'Authorization',
        `Bearer ${loginResponse.body.access_token}`,
      )
      .send({
        interviewId: interview.id,
        rating: 5,
        comments: 'Excellent interview performance',
      })
      .expect(201)
      .expect((response) => {
        expect(response.body.id).toBeDefined();
        expect(response.body.interviewId).toBe(
          interview.id,
        );
        expect(response.body.rating).toBe(5);
        expect(response.body.comments).toBe(
          'Excellent interview performance',
        );
      });
  });

  it('/feedback (POST) without comments', async () => {
    const job =
      await db.orm.public.Job.create({
        title: 'Feedback E2E Job Without Comments',
        description: 'Job for feedback E2E test',
        location: 'Bangalore',
      });

    const candidate =
      await db.orm.public.Candidate.create({
        name: 'Feedback E2E Candidate Without Comments',
        email: `feedback-candidate-no-comments-${Date.now()}@example.com`,
        jobId: job.id,
      });

    const interview =
      await db.orm.public.Interview.create({
        candidateId: candidate.id,
        scheduledAt: '2026-09-18T10:00:00.000Z',
        status: 'SCHEDULED',
      });

    const email =
      `e2e-feedback-create-no-comments-${Date.now()}@example.com`;

    const password = 'TestPassword123!';

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email,
        password,
      })
      .expect(201);

    await db.orm.public.User
      .where({
        email,
      })
      .update({
        role: 'INTERVIEWER',
      });

    const loginResponse =
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email,
          password,
        })
      .expect(201);

    return request(app.getHttpServer())
      .post('/feedback')
      .set(
        'Authorization',
        `Bearer ${loginResponse.body.access_token}`,
      )
      .send({
        interviewId: interview.id,
        rating: 4,
      })
      .expect(201)
      .expect((response) => {
        expect(response.body.id).toBeDefined();
        expect(response.body.interviewId).toBe(
          interview.id,
        );
        expect(response.body.rating).toBe(4);
        expect(response.body.comments).toBeNull();
      });
  });

  it('/auth/refresh (POST) rotates the refresh token', async () => {
    const email =
      `e2e-rotation-${Date.now()}@example.com`;

    const password = 'TestPassword123!';

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email,
        password,
      })
      .expect(201);

    const loginResponse =
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email,
          password,
        })
      .expect(201);

    const oldRefreshToken =
      loginResponse.body.refresh_token;

    expect(oldRefreshToken).toBeDefined();

    const refreshResponse =
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refresh_token: oldRefreshToken,
        })
      .expect(201);

    const newRefreshToken =
      refreshResponse.body.refresh_token;

    expect(newRefreshToken).toBeDefined();

    expect(newRefreshToken).not.toBe(
      oldRefreshToken,
    );

    const user =
      await db.orm.public.User.first({
        email,
      });

    expect(user).toBeDefined();
    expect(user?.refreshTokenHash).toBeDefined();

    const oldTokenDigest =
      createHash('sha256')
        .update(oldRefreshToken)
        .digest('hex');

    const newTokenDigest =
      createHash('sha256')
        .update(newRefreshToken)
        .digest('hex');

    const oldTokenStillMatches =
      await bcrypt.compare(
        oldTokenDigest,
        user!.refreshTokenHash!,
      );

    expect(oldTokenStillMatches).toBe(false);

    const newTokenMatches =
      await bcrypt.compare(
        newTokenDigest,
        user!.refreshTokenHash!,
      );

    expect(newTokenMatches).toBe(true);

    return request(app.getHttpServer())
      .post('/auth/refresh')
      .send({
        refresh_token: oldRefreshToken,
      })
      .expect(401);
  });

  it('/jobs (GET) should return jobs', async () => {
    return request(app.getHttpServer())
      .get('/jobs')
      .expect(200)
      .expect((response) => {
        expect(response.body).toHaveProperty('data');
        expect(
          Array.isArray(response.body.data),
        ).toBe(true);

        expect(response.body).toHaveProperty('page');
        expect(response.body).toHaveProperty('limit');
        expect(response.body).toHaveProperty('search');
        expect(response.body).toHaveProperty('status');
        expect(response.body).toHaveProperty('sort');
        expect(response.body).toHaveProperty('total');
      });
  });

  it('/jobs/health (GET) should return healthy status', async () => {
    return request(app.getHttpServer())
      .get('/jobs/health')
      .expect(200)
      .expect({
        status: 'ok',
        module: 'jobs',
      });
  });

  it('/jobs (POST) should create a job', async () => {
    return request(app.getHttpServer())
      .post('/jobs')
      .send({
        title: 'E2E Test Job',
        description: 'Job created by E2E test',
        location: 'Bangalore',
      })
      .expect(201)
      .expect((response) => {
        expect(response.body.id).toBeDefined();
        expect(response.body.title).toBe(
          'E2E Test Job',
        );
        expect(response.body.description).toBe(
          'Job created by E2E test',
        );
        expect(response.body.location).toBe(
          'Bangalore',
        );
      });
  });

  async function createAdmin() {
    const email = `e2e-admin-${Date.now()}-${Math.random()}@example.com`;
    const password = 'AdminPassword123!';

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password })
      .expect(201);

    await db.orm.public.User.where({ email }).update({
      role: 'ADMIN',
      status: 'ACTIVE',
    });

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(201);

    return { email, id: (await db.orm.public.User.first({ email }))!.id, token: login.body.access_token };
  }

  it('/users (POST) provisions and activates users with assigned roles', async () => {
    const admin = await createAdmin();

    for (const role of ['RECRUITER', 'INTERVIEWER', 'MENTOR', 'ADMIN']) {
      const email = `e2e-provision-${role}-${Date.now()}-${Math.random()}@example.com`;
      const response = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ name: `${role} User`, email, role })
        .expect(201);

      expect(response.body.user.role).toBe(role);
      expect(response.body.user.status).toBe('PENDING');
      expect(response.body.message).toBe(
        'User provisioned successfully. An activation email has been sent.',
      );
      expect(response.body.activationToken).toBeUndefined();

      const activationToken = `e2e-activation-${role}-${Date.now()}`;
      await db.orm.public.User.where({ email }).update({
        activationTokenHash: createHash('sha256')
          .update(activationToken)
          .digest('hex'),
        activationExpiresAt: new Date(Date.now() + 60_000).toISOString(),
      });
      await request(app.getHttpServer())
        .post('/auth/activate')
        .send({ token: activationToken, password: 'UserPassword123!' })
        .expect(201);

      const login = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password: 'UserPassword123!' })
        .expect(201);
      const payload = JSON.parse(Buffer.from(login.body.access_token.split('.')[1], 'base64url').toString());
      expect(payload.role).toBe(role);
    }
  });

  it('/users rejects non-admin provisioning and self updates', async () => {
    const admin = await createAdmin();
    const email = `e2e-mentor-${Date.now()}-${Math.random()}@example.com`;

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: 'UserPassword123!' })
      .expect(201);
    const mentorLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'UserPassword123!' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${mentorLogin.body.access_token}`)
      .send({ name: 'Blocked', email: `blocked-${Date.now()}@example.com`, role: 'ADMIN' })
      .expect(403);

    await request(app.getHttpServer())
      .put(`/users/${(await db.orm.public.User.first({ email }))!.id}`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ role: 'MENTOR' })
      .expect(200);

    await request(app.getHttpServer())
      .put(`/users/${admin.id}`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ role: 'ADMIN' })
      .expect(403);
  });

  it('/users prevents disabling the last active admin', async () => {
    const admin = await createAdmin();

    await request(app.getHttpServer())
      .put(`/users/${admin.id}`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ status: 'DISABLED' })
        .expect(403);
  });
});