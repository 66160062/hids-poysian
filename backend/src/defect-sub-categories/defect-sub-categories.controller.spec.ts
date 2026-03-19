import { Test, TestingModule } from '@nestjs/testing';
import { DefectSubCategoriesController } from './defect-sub-categories.controller';
import { DefectSubCategoriesService } from './defect-sub-categories.service';

describe('DefectSubCategoriesController', () => {
  let controller: DefectSubCategoriesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DefectSubCategoriesController],
      providers: [DefectSubCategoriesService],
    }).compile();

    controller = module.get<DefectSubCategoriesController>(
      DefectSubCategoriesController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
