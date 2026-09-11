import { Test, TestingModule } from '@nestjs/testing';

jest.mock('./prisma/db.js', () => ({
  db: {
    orm: {
      public: {
        Candidate: {
          all: jest.fn(),
        },
        Job: {
          all: jest.fn(),
        },
        Interview: {
          all: jest.fn(),
        },
        Feedback: {
          all: jest.fn(),
        },
      },
    },
  },
}));

jest.mock('./auth/guards/jwt-auth.guard.js', () => ({
  JwtAuthGuard: class JwtAuthGuard {},
}));

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { db } from './prisma/db.js';

describe('AppController', () => {
  let controller: AppController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule =
      await Test.createTestingModule({
        controllers: [AppController],
        providers: [AppService],
      }).compile();

    controller =
      module.get<AppController>(AppController);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return Hello World!', () => {
    expect(controller.getHello()).toBe(
      'Hello World!',
    );
  });

  it('should return health status', () => {
    expect(controller.getHealth()).toEqual({
      status: 'ok',
      message: 'HireDesk backend is healthy',
    });
  });

  describe('getDashboard', () => {
    it('should return dashboard statistics and recent candidates', async () => {
      const fixedNow = new Date(
        '2026-09-10T10:00:00Z',
      );

      jest.useFakeTimers();
      jest.setSystemTime(fixedNow);

      const candidates = [
        {
          id: 1,
          name: 'Older Candidate',
          email: 'older@example.com',
          jobId: 1,
          createdAt: '2026-09-01T10:00:00Z',
        },
        {
          id: 2,
          name: 'Recent Candidate',
          email: 'recent@example.com',
          jobId: 1,
          createdAt: '2026-09-09T10:00:00Z',
        },
      ];

      const jobs = [
        {
          id: 1,
          title: 'Backend Developer',
          status: 'OPEN',
        },
        {
          id: 2,
          title: 'Frontend Developer',
          status: 'CLOSED',
        },
        {
          id: 3,
          title: 'Data Scientist',
          status: 'OPEN',
        },
      ];

      const interviews = [
        {
          id: 1,
          candidateId: 1,
          scheduledAt: '2026-09-11T10:00:00Z',
          status: 'SCHEDULED',
        },
        {
          id: 2,
          candidateId: 2,
          scheduledAt: '2026-09-12T10:00:00Z',
          status: 'COMPLETED',
        },
        {
          id: 3,
          candidateId: 1,
          scheduledAt: '2026-09-05T10:00:00Z',
          status: 'SCHEDULED',
        },
      ];

      const feedback = [
        {
          id: 1,
          interviewId: 2,
          rating: 5,
        },
        {
          id: 2,
          interviewId: 1,
          rating: 4,
        },
      ];

      (
        db.orm.public.Candidate.all as jest.Mock
      ).mockResolvedValue(candidates);

      (
        db.orm.public.Job.all as jest.Mock
      ).mockResolvedValue(jobs);

      (
        db.orm.public.Interview.all as jest.Mock
      ).mockResolvedValue(interviews);

      (
        db.orm.public.Feedback.all as jest.Mock
      ).mockResolvedValue(feedback);

      const result = await controller.getDashboard();

      expect(result).toEqual({
        candidates: 2,
        jobs: 3,
        openJobs: 2,
        interviews: 3,
        scheduledInterviews: 2,
        completedInterviews: 1,
        feedback: 2,

        recentCandidates: [
          {
            id: 2,
            name: 'Recent Candidate',
            email: 'recent@example.com',
            createdAt: '2026-09-09T10:00:00Z',
          },
          {
            id: 1,
            name: 'Older Candidate',
            email: 'older@example.com',
            createdAt: '2026-09-01T10:00:00Z',
          },
        ],

        upcomingInterviews: [
          {
            id: 1,
            candidateId: 1,
            candidateName: 'Older Candidate',
            candidateEmail: 'older@example.com',
            scheduledAt: '2026-09-11T10:00:00Z',
            status: 'SCHEDULED',
          },
        ],
      });

      expect(
        db.orm.public.Candidate.all,
      ).toHaveBeenCalledTimes(1);

      expect(
        db.orm.public.Job.all,
      ).toHaveBeenCalledTimes(1);

      expect(
        db.orm.public.Interview.all,
      ).toHaveBeenCalledTimes(1);

      expect(
        db.orm.public.Feedback.all,
      ).toHaveBeenCalledTimes(1);
    });

    it('should use fallback candidate information when candidate is not found', async () => {
      const fixedNow = new Date(
        '2026-09-10T10:00:00Z',
      );

      jest.useFakeTimers();
      jest.setSystemTime(fixedNow);

      const candidates = [
        {
          id: 1,
          name: 'Existing Candidate',
          email: 'existing@example.com',
          jobId: 1,
          createdAt: '2026-09-09T10:00:00Z',
        },
      ];

      const jobs = [
        {
          id: 1,
          title: 'Backend Developer',
          status: 'OPEN',
        },
      ];

      const interviews = [
        {
          id: 10,
          candidateId: 999,
          scheduledAt: '2026-09-11T10:00:00Z',
          status: 'SCHEDULED',
        },
      ];

      const feedback: any[] = [];

      (
        db.orm.public.Candidate.all as jest.Mock
      ).mockResolvedValue(candidates);

      (
        db.orm.public.Job.all as jest.Mock
      ).mockResolvedValue(jobs);

      (
        db.orm.public.Interview.all as jest.Mock
      ).mockResolvedValue(interviews);

      (
        db.orm.public.Feedback.all as jest.Mock
      ).mockResolvedValue(feedback);

      const result = await controller.getDashboard();

      expect(result.upcomingInterviews).toEqual([
        {
          id: 10,
          candidateId: 999,
          candidateName: 'Candidate #999',
          candidateEmail: '',
          scheduledAt: '2026-09-11T10:00:00Z',
          status: 'SCHEDULED',
        },
      ]);
    });

    it('should return empty dashboard lists when there is no data', async () => {
      (
        db.orm.public.Candidate.all as jest.Mock
      ).mockResolvedValue([]);

      (
        db.orm.public.Job.all as jest.Mock
      ).mockResolvedValue([]);

      (
        db.orm.public.Interview.all as jest.Mock
      ).mockResolvedValue([]);

      (
        db.orm.public.Feedback.all as jest.Mock
      ).mockResolvedValue([]);

      const result = await controller.getDashboard();

      expect(result).toEqual({
        candidates: 0,
        jobs: 0,
        openJobs: 0,
        interviews: 0,
        scheduledInterviews: 0,
        completedInterviews: 0,
        feedback: 0,
        recentCandidates: [],
        upcomingInterviews: [],
      });
    });

    it('should exclude past scheduled interviews from upcoming interviews', async () => {
      const fixedNow = new Date(
        '2026-09-10T10:00:00Z',
      );

      jest.useFakeTimers();
      jest.setSystemTime(fixedNow);

      const candidates = [
        {
          id: 1,
          name: 'Candidate One',
          email: 'one@example.com',
          jobId: 1,
          createdAt: '2026-09-09T10:00:00Z',
        },
      ];

      const jobs = [
        {
          id: 1,
          title: 'Backend Developer',
          status: 'OPEN',
        },
      ];

      const interviews = [
        {
          id: 1,
          candidateId: 1,
          scheduledAt: '2026-09-01T10:00:00Z',
          status: 'SCHEDULED',
        },
        {
          id: 2,
          candidateId: 1,
          scheduledAt: '2026-09-11T10:00:00Z',
          status: 'SCHEDULED',
        },
      ];

      (
        db.orm.public.Candidate.all as jest.Mock
      ).mockResolvedValue(candidates);

      (
        db.orm.public.Job.all as jest.Mock
      ).mockResolvedValue(jobs);

      (
        db.orm.public.Interview.all as jest.Mock
      ).mockResolvedValue(interviews);

      (
        db.orm.public.Feedback.all as jest.Mock
      ).mockResolvedValue([]);

      const result = await controller.getDashboard();

      expect(result.upcomingInterviews).toHaveLength(1);
      expect(result.upcomingInterviews[0].id).toBe(2);
    });

    it('should exclude non-scheduled future interviews from upcoming interviews', async () => {
      const fixedNow = new Date(
        '2026-09-10T10:00:00Z',
      );

      jest.useFakeTimers();
      jest.setSystemTime(fixedNow);

      (
        db.orm.public.Candidate.all as jest.Mock
      ).mockResolvedValue([]);

      (
        db.orm.public.Job.all as jest.Mock
      ).mockResolvedValue([]);

      (
        db.orm.public.Interview.all as jest.Mock
      ).mockResolvedValue([
        {
          id: 1,
          candidateId: 1,
          scheduledAt: '2026-09-11T10:00:00Z',
          status: 'COMPLETED',
        },
        {
          id: 2,
          candidateId: 1,
          scheduledAt: '2026-09-12T10:00:00Z',
          status: 'CANCELLED',
        },
      ]);

      (
        db.orm.public.Feedback.all as jest.Mock
      ).mockResolvedValue([]);

      const result = await controller.getDashboard();

      expect(result.upcomingInterviews).toEqual([]);
    });

    it('should limit recent candidates to five', async () => {
      const candidates = Array.from(
        { length: 7 },
        (_, index) => ({
          id: index + 1,
          name: `Candidate ${index + 1}`,
          email: `candidate${index + 1}@example.com`,
          jobId: 1,
          createdAt: `2026-09-${String(
            10 - index,
          ).padStart(2, '0')}T10:00:00Z`,
        }),
      );

      (
        db.orm.public.Candidate.all as jest.Mock
      ).mockResolvedValue(candidates);

      (
        db.orm.public.Job.all as jest.Mock
      ).mockResolvedValue([]);

      (
        db.orm.public.Interview.all as jest.Mock
      ).mockResolvedValue([]);

      (
        db.orm.public.Feedback.all as jest.Mock
      ).mockResolvedValue([]);

      const result = await controller.getDashboard();

      expect(result.recentCandidates).toHaveLength(5);
      expect(
        result.recentCandidates.map(
          (candidate) => candidate.id,
        ),
      ).toEqual([1, 2, 3, 4, 5]);
    });

    it('should limit upcoming interviews to five', async () => {
      const candidates = [
        {
          id: 1,
          name: 'Candidate One',
          email: 'one@example.com',
          jobId: 1,
          createdAt: '2026-09-09T10:00:00Z',
        },
      ];

      const interviews = Array.from(
        { length: 7 },
        (_, index) => ({
          id: index + 1,
          candidateId: 1,
          scheduledAt: `2026-09-${String(
            11 + index,
          ).padStart(2, '0')}T10:00:00Z`,
          status: 'SCHEDULED',
        }),
      );

      (
        db.orm.public.Candidate.all as jest.Mock
      ).mockResolvedValue(candidates);

      (
        db.orm.public.Job.all as jest.Mock
      ).mockResolvedValue([]);

      (
        db.orm.public.Interview.all as jest.Mock
      ).mockResolvedValue(interviews);

      (
        db.orm.public.Feedback.all as jest.Mock
      ).mockResolvedValue([]);

      const result = await controller.getDashboard();

      expect(result.upcomingInterviews).toHaveLength(5);
      expect(
        result.upcomingInterviews.map(
          (interview) => interview.id,
        ),
      ).toEqual([1, 2, 3, 4, 5]);
    });
  });
});