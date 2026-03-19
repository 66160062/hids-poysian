import { Test, TestingModule } from '@nestjs/testing';
import { DefectCategoriesService } from './defect-categories.service';

describe('DefectsCategoriesService', () => {
  let service: DefectCategoriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DefectCategoriesService],
    }).compile();

    service = module.get<DefectCategoriesService>(DefectCategoriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
