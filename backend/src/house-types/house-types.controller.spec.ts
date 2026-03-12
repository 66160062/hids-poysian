import { Test, TestingModule } from '@nestjs/testing';
import { HouseTypesController } from './house-types.controller';
import { HouseTypesService } from './house-types.service';

describe('HouseTypesController', () => {
  let controller: HouseTypesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HouseTypesController],
      providers: [HouseTypesService],
    }).compile();

    controller = module.get<HouseTypesController>(HouseTypesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
