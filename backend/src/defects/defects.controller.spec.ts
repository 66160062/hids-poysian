import { Test, TestingModule } from '@nestjs/testing';
import { DefectsController } from './defects.controller';
import { DefectsService } from './defects.service';
import { AuthService } from 'src/auth/auth.service';

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
      providers: [
        { provide: DefectsService, useValue: serviceMock },
        { provide: AuthService, useValue: { verifyLinkToken: jest.fn() } },
      ],
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
    }, {
      user: { project_id: 12, role: 'contractor' },
    } as never);

    expect(defectsService.contractorUpdate).toHaveBeenCalledWith({
      defectId: 7,
      contractorId: 3,
      note: 'Fixed',
      linkPayload: { project_id: 12, role: 'contractor' },
      contractorImageUrl: '/uploads/defects/fixed.jpg',
      contractorImageFileSize: 1234,
    });
  });
});
