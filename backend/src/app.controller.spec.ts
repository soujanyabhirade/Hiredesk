import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

describe('AppController', () => {
  let controller: AppController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    controller = module.get<AppController>(AppController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return Hello World!', () => {
    expect(controller.getHello()).toBe('Hello World!');
  });

  it('should return health status', () => {
    expect(controller.getHealth()).toEqual({
      status: 'ok',
      message: 'HireDesk backend is healthy',
    });
  });
});