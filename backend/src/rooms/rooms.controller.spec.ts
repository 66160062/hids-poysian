import { Test, TestingModule } from '@nestjs/testing';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';

describe('RoomsController', () => {
  let controller: RoomsController;
  let service: jest.Mocked<Pick<RoomsService, 'findOne' | 'remove'>>;

  beforeEach(async () => {
    const serviceMock = { findOne: jest.fn(), remove: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoomsController],
      providers: [{ provide: RoomsService, useValue: serviceMock }],
    }).compile();

    controller = module.get<RoomsController>(RoomsController);
    service = module.get(RoomsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('converts the route param to a number when looking up one room', () => {
    controller.findOne('3');

    expect(service.findOne).toHaveBeenCalledWith(3);
  });
});
