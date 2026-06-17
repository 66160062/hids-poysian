import { Test, TestingModule } from '@nestjs/testing';
import { DefectsController } from './defects.controller';
import { DefectsService } from './defects.service';

jest.mock('uuid', () => ({
  v4: () => 'test-uuid',
}));

describe('DefectsController', () => {
  let controller: DefectsController;
  let defectsService: jest.Mocked<Pick<DefectsService, 'contractorUpdate'>>;

  beforeEach(async () => {
    const serviceMock = {
      contractorUpdate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DefectsController],
      providers: [{ provide: DefectsService, useValue: serviceMock }],
    }).compile();

    controller = module.get<DefectsController>(DefectsController);
    defectsService = module.get(DefectsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should pass contractor update payload with uploaded file metadata', () => {
    const file = {
      filename: 'fixed.jpg',
      size: 1234,
    } as Express.Multer.File;

    void controller.contractorUpdate(file, {
      defectId: 7,
      contractorId: 3,
      note: 'Fixed',
    });

    expect(defectsService.contractorUpdate).toHaveBeenCalledWith({
      defectId: 7,
      contractorId: 3,
      note: 'Fixed',
      contractorImageUrl: '/uploads/defects/fixed.jpg',
      contractorImageFileSize: 1234,
    });
  });
});
