import { Test, TestingModule } from '@nestjs/testing';
import { DefectCategoriesController } from './defect-categories.controller';
import { DefectCategoriesService } from './defect-categories.service';

describe('DefectCategoriesController', () => {
  let controller: DefectCategoriesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DefectCategoriesController],
      providers: [DefectCategoriesService],
    }).compile();

    controller = module.get<DefectCategoriesController>(
      DefectCategoriesController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
