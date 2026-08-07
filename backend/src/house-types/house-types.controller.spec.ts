import { Test, TestingModule } from '@nestjs/testing';
import { HouseTypesController } from './house-types.controller';
import { HouseTypesService } from './house-types.service';

describe('HouseTypesController', () => {
  let controller: HouseTypesController;
  let service: jest.Mocked<Pick<HouseTypesService, 'findOne' | 'remove'>>;

  beforeEach(async () => {
    const serviceMock = {
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HouseTypesController],
      providers: [{ provide: HouseTypesService, useValue: serviceMock }],
    }).compile();

    controller = module.get<HouseTypesController>(HouseTypesController);
    service = module.get(HouseTypesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('converts the route param to a number when looking up one house type', () => {
    controller.findOne('3');

    expect(service.findOne).toHaveBeenCalledWith(3);
  });
});
