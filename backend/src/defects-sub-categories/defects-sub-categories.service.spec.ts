import { Test, TestingModule } from '@nestjs/testing';
import { DefectsSubCategoriesService } from './defects-sub-categories.service';

describe('DefectsSubCategoriesService', () => {
  let service: DefectsSubCategoriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DefectsSubCategoriesService],
    }).compile();

    service = module.get<DefectsSubCategoriesService>(DefectsSubCategoriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
