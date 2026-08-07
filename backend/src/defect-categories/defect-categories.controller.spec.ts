import { Test, TestingModule } from '@nestjs/testing';
import { DefectCategoriesController } from './defect-categories.controller';
import { DefectCategoriesService } from './defect-categories.service';

describe('DefectCategoriesController', () => {
  let controller: DefectCategoriesController;
  let service: jest.Mocked<Pick<DefectCategoriesService, 'findOne' | 'update' | 'remove'>>;

  beforeEach(async () => {
    const serviceMock = {
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DefectCategoriesController],
      providers: [
        { provide: DefectCategoriesService, useValue: serviceMock },
      ],
    }).compile();

    controller = module.get<DefectCategoriesController>(
      DefectCategoriesController,
    );
    service = module.get(DefectCategoriesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('converts the route param to a number when looking up one category', () => {
    controller.findOne('3');

    expect(service.findOne).toHaveBeenCalledWith(3);
  });

  it('converts the route param to a number when removing a category', () => {
    controller.remove('3');

    expect(service.remove).toHaveBeenCalledWith(3);
  });
});
