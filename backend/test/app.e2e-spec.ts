/// <reference types="jest" />

import {
  describe,
  it,
  expect,
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

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule =
      await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

    app = moduleFixture.createNestApplication();

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
        expect(Array.isArray(response.body)).toBe(true);
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
        expect(Array.isArray(response.body)).toBe(true);
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
});