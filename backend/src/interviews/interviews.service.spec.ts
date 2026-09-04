import { InterviewsService } from './interviews.service.js';

jest.mock('../prisma/db.js', () => ({
  db: {
    orm: {
      public: {
        Interview: {
          create: jest.fn(),
          all: jest.fn(),
        },
      },
    },
  },
}));

import { db } from '../prisma/db.js';

describe('InterviewsService', () => {
  let service: InterviewsService;

  beforeEach(() => {
    service = new InterviewsService();

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create an interview using Prisma', async () => {
    const interview = {
      id: 1,
      candidateId: 1,
      scheduledAt: '2026-09-04T10:00:00Z',
      status: 'SCHEDULED',
      createdAt: '2026-09-04T09:00:00Z',
      updatedAt: '2026-09-04T09:00:00Z',
    };

    (
      db.orm.public.Interview.create as jest.Mock
    ).mockResolvedValue(interview);

    const result = await service.create({
      candidateId: 1,
      scheduledAt: '2026-09-04T10:00:00Z',
      status: 'SCHEDULED',
    });

    expect(result).toEqual(interview);

    expect(
      db.orm.public.Interview.create,
    ).toHaveBeenCalledWith({
      candidateId: 1,
      scheduledAt: '2026-09-04T10:00:00Z',
      status: 'SCHEDULED',
    });
  });

  it('should use the default status when status is not provided', async () => {
    const interview = {
      id: 2,
      candidateId: 1,
      scheduledAt: '2026-09-05T10:00:00Z',
      status: 'SCHEDULED',
    };

    (
      db.orm.public.Interview.create as jest.Mock
    ).mockResolvedValue(interview);

    const result = await service.create({
      candidateId: 1,
      scheduledAt: '2026-09-05T10:00:00Z',
    });

    expect(result).toEqual(interview);

    expect(
      db.orm.public.Interview.create,
    ).toHaveBeenCalledWith({
      candidateId: 1,
      scheduledAt: '2026-09-05T10:00:00Z',
    });
  });

  it('should return all interviews using Prisma', async () => {
    const interviews = [
      {
        id: 1,
        candidateId: 1,
        scheduledAt: '2026-09-04T10:00:00Z',
        status: 'SCHEDULED',
      },
      {
        id: 2,
        candidateId: 2,
        scheduledAt: '2026-09-05T10:00:00Z',
        status: 'SCHEDULED',
      },
    ];

    (
      db.orm.public.Interview.all as jest.Mock
    ).mockResolvedValue(interviews);

    const result = await service.findAll();

    expect(result).toEqual(interviews);

    expect(
      db.orm.public.Interview.all,
    ).toHaveBeenCalledTimes(1);
  });

  it('should return the interviews health status', () => {
    expect(service.getHealth()).toEqual({
      status: 'ok',
      module: 'interviews',
    });
  });
});