import { Test, TestingModule } from '@nestjs/testing';
import { CandidatesController } from './candidates.controller.js';
import { CandidatesService } from './candidates.service.js';
import { JwtService } from '@nestjs/jwt';

describe('CandidatesController', () => {
  let controller: CandidatesController;

  beforeEach(async () => {
    const module: TestingModule =
      await Test.createTestingModule({
        controllers: [CandidatesController],
        providers: [
          CandidatesService,
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

  it('should return candidates', () => {
    expect(controller.findAll()).toEqual([]);
  });
});