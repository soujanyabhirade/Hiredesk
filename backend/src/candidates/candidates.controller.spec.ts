jest.mock('../prisma/db.js', () => ({
  db: {
    orm: {
      public: {
        Candidate: {
          create: jest.fn(),
          all: jest.fn(),
          first: jest.fn(),
          where: jest.fn(),
        },
      },
    },
  },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';

import { CandidatesController } from './candidates.controller.js';
import { CandidatesService } from './candidates.service.js';

describe('CandidatesController', () => {
  let controller: CandidatesController;

  const mockCandidatesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getHealth: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule =
      await Test.createTestingModule({
        controllers: [CandidatesController],
        providers: [
          {
            provide: CandidatesService,
            useValue: mockCandidatesService,
          },
          {
            provide: JwtService,
            useValue: {
              verifyAsync: jest.fn(),
              signAsync: jest.fn(),
            },
          },
        ],
      }).compile();

    controller =
      module.get<CandidatesController>(
        CandidatesController,
      );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return candidates', async () => {
      const candidates = [
        {
          id: 1,
          name: 'Test Candidate',
          email: 'test@example.com',
          phone: '9999999999',
          jobId: 1,
        },
      ];

      mockCandidatesService.findAll.mockResolvedValue(
        candidates,
      );

      const result = await controller.findAll();

      expect(
        mockCandidatesService.findAll,
      ).toHaveBeenCalled();

      expect(result).toEqual(candidates);
    });
  });

  describe('findOne', () => {
    it('should return one candidate', async () => {
      const candidate = {
        id: 17,
        name: 'Test Candidate',
        email: 'test@example.com',
        phone: '9999999999',
        jobId: 1,
      };

      mockCandidatesService.findOne.mockResolvedValue(
        candidate,
      );

      const result =
        await controller.findOne('17');

      expect(
        mockCandidatesService.findOne,
      ).toHaveBeenCalledWith(17);

      expect(result).toEqual(candidate);
    });
  });

  describe('create', () => {
    it('should create a candidate', async () => {
      const dto = {
        name: 'New Candidate',
        email: 'new@example.com',
        phone: '8888888888',
        jobId: 1,
      };

      const candidate = {
        id: 18,
        ...dto,
      };

      mockCandidatesService.create.mockResolvedValue(
        candidate,
      );

      const result =
        await controller.create(dto);

      expect(
        mockCandidatesService.create,
      ).toHaveBeenCalledWith(dto);

      expect(result).toEqual(candidate);
    });
  });

  describe('update', () => {
    it('should update a candidate', async () => {
      const body = {
        name: 'Updated Candidate',
        phone: '7777777777',
      };

      const candidate = {
        id: 17,
        name: 'Updated Candidate',
        email: 'test@example.com',
        phone: '7777777777',
        jobId: 1,
      };

      mockCandidatesService.update.mockResolvedValue(
        candidate,
      );

      const result =
        await controller.update('17', body);

      expect(
        mockCandidatesService.update,
      ).toHaveBeenCalledWith(17, body);

      expect(result).toEqual(candidate);
    });
  });

  describe('delete', () => {
    it('should delete a candidate', async () => {
      const response = {
        message:
          'Candidate with id 17 deleted successfully',
      };

      mockCandidatesService.delete.mockResolvedValue(
        response,
      );

      const result =
        await controller.delete('17');

      expect(
        mockCandidatesService.delete,
      ).toHaveBeenCalledWith(17);

      expect(result).toEqual(response);
    });
  });

  describe('getHealth', () => {
    it('should return health status', () => {
      const health = {
        status: 'ok',
        module: 'candidates',
      };

      mockCandidatesService.getHealth.mockReturnValue(
        health,
      );

      const result = controller.getHealth();

      expect(
        mockCandidatesService.getHealth,
      ).toHaveBeenCalled();

      expect(result).toEqual(health);
    });
  });
});