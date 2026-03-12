import { Test, TestingModule } from '@nestjs/testing';
import { DefectsSubCategoriesController } from './defects-sub-categories.controller';
import { DefectsSubCategoriesService } from './defects-sub-categories.service';

describe('DefectsSubCategoriesController', () => {
  let controller: DefectsSubCategoriesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DefectsSubCategoriesController],
      providers: [DefectsSubCategoriesService],
    }).compile();

    controller = module.get<DefectsSubCategoriesController>(DefectsSubCategoriesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
