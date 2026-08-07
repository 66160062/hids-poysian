import { Test, TestingModule } from '@nestjs/testing';
import { DefectSubCategoriesController } from './defect-sub-categories.controller';
import { DefectSubCategoriesService } from './defect-sub-categories.service';

describe('DefectSubCategoriesController', () => {
  let controller: DefectSubCategoriesController;
  let service: jest.Mocked<Pick<DefectSubCategoriesService, 'findOne' | 'remove'>>;

  beforeEach(async () => {
    const serviceMock = {
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DefectSubCategoriesController],
      providers: [
        { provide: DefectSubCategoriesService, useValue: serviceMock },
      ],
    }).compile();

    controller = module.get<DefectSubCategoriesController>(
      DefectSubCategoriesController,
    );
    service = module.get(DefectSubCategoriesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('passes the parsed id straight through from the ParseIntPipe param', () => {
    controller.findOne(5);

    expect(service.findOne).toHaveBeenCalledWith(5);
  });

  it('passes the parsed id straight through when removing', () => {
    controller.remove(5);

    expect(service.remove).toHaveBeenCalledWith(5);
  });
});
