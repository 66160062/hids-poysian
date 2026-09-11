import { Test, TestingModule } from '@nestjs/testing';
import { SubRoomsController } from './sub-rooms.controller';
import { SubRoomsService } from './sub-rooms.service';

describe('SubRoomsController', () => {
  let controller: SubRoomsController;
  let service: jest.Mocked<Pick<SubRoomsService, 'findOne' | 'remove'>>;

  beforeEach(async () => {
    const serviceMock = { findOne: jest.fn(), remove: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubRoomsController],
      providers: [{ provide: SubRoomsService, useValue: serviceMock }],
    }).compile();

    controller = module.get<SubRoomsController>(SubRoomsController);
    service = module.get(SubRoomsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('converts the route param to a number when looking up one sub-room', () => {
    controller.findOne('6');

    expect(service.findOne).toHaveBeenCalledWith(6);
  });
});
