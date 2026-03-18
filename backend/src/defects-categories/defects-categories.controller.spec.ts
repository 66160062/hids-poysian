import { Test, TestingModule } from '@nestjs/testing';
import { DefectsCategoriesController } from './defects-categories.controller';
import { DefectsCategoriesService } from './defects-categories.service';

describe('DefectsCategoriesController', () => {
  let controller: DefectsCategoriesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DefectsCategoriesController],
      providers: [DefectsCategoriesService],
    }).compile();

    controller = module.get<DefectsCategoriesController>(DefectsCategoriesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
