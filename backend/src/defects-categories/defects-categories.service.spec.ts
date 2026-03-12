import { Test, TestingModule } from '@nestjs/testing';
import { DefectsCategoriesService } from './defects-categories.service';

describe('DefectsCategoriesService', () => {
  let service: DefectsCategoriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DefectsCategoriesService],
    }).compile();

    service = module.get<DefectsCategoriesService>(DefectsCategoriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
