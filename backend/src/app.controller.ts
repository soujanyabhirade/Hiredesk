import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from './auth/guards/jwt-auth.guard.js';

import { db } from './prisma/db.js';

import { AppService } from './app.service.js';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      message: 'HireDesk backend is healthy',
    };
  }

  @Get('dashboard')
  @UseGuards(JwtAuthGuard)
  async getDashboard() {
    const [
      candidates,
      jobs,
      interviews,
      feedback,
    ] = await Promise.all([
      db.orm.public.Candidate.all(),
      db.orm.public.Job.all(),
      db.orm.public.Interview.all(),
      db.orm.public.Feedback.all(),
    ]);

    const openJobs = jobs.filter(
      (job) =>
        job.status.toLowerCase() === 'open',
    ).length;

    const scheduledInterviews =
      interviews.filter(
        (interview) =>
          interview.status.toLowerCase() ===
          'scheduled',
      ).length;

    const completedInterviews =
      interviews.filter(
        (interview) =>
          interview.status.toLowerCase() ===
          'completed',
      ).length;

    const recentCandidates = [
      ...candidates,
    ]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime(),
      )
      .slice(0, 5)
      .map((candidate) => ({
        id: candidate.id,
        name: candidate.name,
        email: candidate.email,
        createdAt: candidate.createdAt,
      }));

    const now = Date.now();

    const upcomingInterviews = [
      ...interviews,
    ]
      .filter(
        (interview) =>
          interview.status.toLowerCase() ===
            'scheduled' &&
          new Date(
            interview.scheduledAt,
          ).getTime() >= now,
      )
      .sort(
        (a, b) =>
          new Date(
            a.scheduledAt,
          ).getTime() -
          new Date(
            b.scheduledAt,
          ).getTime(),
      )
      .slice(0, 5)
      .map((interview) => {
        const candidate = candidates.find(
          (item) =>
            item.id ===
            interview.candidateId,
        );

        return {
          id: interview.id,
          candidateId:
            interview.candidateId,
          candidateName:
            candidate?.name ||
            `Candidate #${interview.candidateId}`,
          candidateEmail:
            candidate?.email || '',
          scheduledAt:
            interview.scheduledAt,
          status: interview.status,
        };
      });

    return {
      candidates: candidates.length,
      jobs: jobs.length,
      openJobs,
      interviews: interviews.length,
      scheduledInterviews,
      completedInterviews,
      feedback: feedback.length,
      recentCandidates,
      upcomingInterviews,
    };
  }
}