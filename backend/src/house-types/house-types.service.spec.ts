import { Test, TestingModule } from '@nestjs/testing';
import { HouseTypesService } from './house-types.service';

describe('HouseTypesService', () => {
  let service: HouseTypesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HouseTypesService],
    }).compile();

    service = module.get<HouseTypesService>(HouseTypesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
