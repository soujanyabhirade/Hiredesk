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
import {
  BadRequestException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { CandidatesController } from './candidates.controller.js';
import { CandidatesService } from './candidates.service.js';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';

describe('CandidatesController', () => {
  let controller: CandidatesController;

  const mockCandidatesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getHealth: jest.fn(),
    exportCsv: jest.fn(),
    importCsv: jest.fn(),
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
        ],
      })
        .overrideGuard(JwtAuthGuard)
        .useValue({
          canActivate: jest.fn().mockReturnValue(true),
        })
        .overrideGuard(RolesGuard)
        .useValue({
          canActivate: jest.fn().mockReturnValue(true),
        })
        .compile();

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

  describe('importCandidates', () => {
    function csvFile(
      originalname: string,
      content: string,
    ) {
      return {
        originalname,
        buffer: Buffer.from(content, 'utf8'),
      } as Express.Multer.File;
    }

    it('should import the uploaded csv file', async () => {
      const result = {
        totalRows: 1,
        imported: 1,
        failed: 0,
        errors: [],
      };

      mockCandidatesService.importCsv.mockResolvedValue(
        result,
      );

      const uploaded = await controller.importCandidates(
        csvFile(
          'candidates.csv',
          'name,email,jobId\nAda,ada@example.com,1\n',
        ),
      );

      expect(
        mockCandidatesService.importCsv,
      ).toHaveBeenCalledWith(
        'name,email,jobId\nAda,ada@example.com,1\n',
      );

      expect(uploaded).toEqual(result);
    });

    it('should throw when no file is uploaded', () => {
      expect(() =>
        controller.importCandidates(undefined),
      ).toThrow(BadRequestException);
    });

    it('should throw when the file is not a csv file', () => {
      expect(() =>
        controller.importCandidates(
          csvFile('candidates.txt', 'name'),
        ),
      ).toThrow('Only .csv files are supported.');
    });

    it('should throw when the uploaded file is empty', () => {
      expect(() =>
        controller.importCandidates(
          csvFile('candidates.csv', ''),
        ),
      ).toThrow('The uploaded CSV file is empty.');
    });
  });

  describe('exportCandidates', () => {
    it('should send the csv file as a download', async () => {
      mockCandidatesService.exportCsv.mockResolvedValue(
        'name,email,phone,jobId,jobTitle\r\n',
      );

      const response = {
        setHeader: jest.fn(),
        send: jest.fn(),
      };

      await controller.exportCandidates(
        response as never,
        '2',
        'ada',
      );

      expect(
        mockCandidatesService.exportCsv,
      ).toHaveBeenCalledWith(2, 'ada');

      expect(response.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'text/csv; charset=utf-8',
      );

      expect(
        response.setHeader,
      ).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringContaining(
          'attachment; filename="hiredesk-candidates-',
        ),
      );

      expect(response.send).toHaveBeenCalledWith(
        '\uFEFFname,email,phone,jobId,jobTitle\r\n',
      );
    });

    it('should export without filters', async () => {
      mockCandidatesService.exportCsv.mockResolvedValue('');

      const response = {
        setHeader: jest.fn(),
        send: jest.fn(),
      };

      await controller.exportCandidates(
        response as never,
      );

      expect(
        mockCandidatesService.exportCsv,
      ).toHaveBeenCalledWith(
        undefined,
        '',
      );
    });
  });
});