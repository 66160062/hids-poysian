import { Test, TestingModule } from '@nestjs/testing';
import { FloorController } from './floor.controller';
import { FloorService } from './floor.service';

describe('FloorController', () => {
  let controller: FloorController;
  let service: jest.Mocked<Pick<FloorService, 'findOne' | 'remove'>>;

  beforeEach(async () => {
    const serviceMock = {
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FloorController],
      providers: [{ provide: FloorService, useValue: serviceMock }],
    }).compile();

    controller = module.get<FloorController>(FloorController);
    service = module.get(FloorService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('converts the route param to a number when looking up one floor', () => {
    controller.findOne('2');

    expect(service.findOne).toHaveBeenCalledWith(2);
  });
});
