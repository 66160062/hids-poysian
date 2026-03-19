import { Test, TestingModule } from '@nestjs/testing';
import { DefectSubCategoriesService } from './defect-sub-categories.service';

describe('DefectSubCategoriesService', () => {
  let service: DefectSubCategoriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DefectSubCategoriesService],
    }).compile();

    service = module.get<DefectSubCategoriesService>(
      DefectSubCategoriesService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
