import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { DefectsController } from './defects.controller';
import { DefectsService } from './defects.service';
import { StorageService } from 'src/storage/storage.service';
import { ReportsService } from 'src/reports/reports.service';
import { AuthService } from 'src/auth/auth.service';
import { InspectionRound } from 'src/inspection-rounds/entities/inspection-round.entity';
import { Defect } from './entities/defect.entity';

describe('DefectsController', () => {
  let controller: DefectsController;
  let defectsService: jest.Mocked<Pick<DefectsService, 'contractorUpdate'>>;
  let storageService: jest.Mocked<Pick<StorageService, 'uploadImage'>>;
  let reportsService: jest.Mocked<Pick<ReportsService, 'scheduleRegeneration'>>;

  beforeEach(async () => {
    const serviceMock = {
      contractorUpdate: jest.fn(),
    };
    const storageMock = { uploadImage: jest.fn() };
    const reportsMock = { scheduleRegeneration: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DefectsController],
      providers: [
        { provide: DefectsService, useValue: serviceMock },
        { provide: StorageService, useValue: storageMock },
        { provide: ReportsService, useValue: reportsMock },
        {
          provide: AuthService,
          useValue: {
            verifyLinkToken: jest.fn(),
            verifyJobAccess: jest.fn(),
            verifyRoundAccess: jest.fn(),
          },
        },
        { provide: getRepositoryToken(InspectionRound), useValue: {} },
        { provide: getRepositoryToken(Defect), useValue: {} },
        { provide: JwtService, useValue: { verify: jest.fn() } },
      ],
    }).compile();

    controller = module.get<DefectsController>(DefectsController);
    defectsService = module.get(DefectsService);
    storageService = module.get(StorageService);
    reportsService = module.get(ReportsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('uploads the contractor image and forwards its url and size with the link payload', async () => {
    storageService.uploadImage.mockResolvedValue(
      'https://example.com/defects/fixed.jpg',
    );
    defectsService.contractorUpdate.mockResolvedValue({
      round: { roundId: 9 },
    } as never);
    const file = {
      buffer: Buffer.from('img'),
      size: 1234,
    } as Express.Multer.File;

    await controller.contractorUpdate(
      file,
      { defectId: 7, contractorId: 3, note: 'Fixed' },
      { user: { project_id: 12, role: 'contractor' } } as never,
    );

    expect(storageService.uploadImage).toHaveBeenCalledWith(
      file.buffer,
      'defects',
    );
    expect(defectsService.contractorUpdate).toHaveBeenCalledWith({
      defectId: 7,
      contractorId: 3,
      note: 'Fixed',
      linkPayload: { project_id: 12, role: 'contractor' },
      contractorImageUrl: 'https://example.com/defects/fixed.jpg',
      contractorImageFileSize: 1234,
    });
  });

  it('schedules PDF regeneration for the round the updated defect belongs to', async () => {
    defectsService.contractorUpdate.mockResolvedValue({
      round: { roundId: 9 },
    } as never);

    await controller.contractorUpdate(
      undefined as unknown as Express.Multer.File,
      { defectId: 7, contractorId: 3, note: 'Fixed' },
      { user: { project_id: 12, role: 'contractor' } } as never,
    );

    expect(reportsService.scheduleRegeneration).toHaveBeenCalledWith(9);
  });

  it('does not attach image fields to the update payload when no file is uploaded', async () => {
    defectsService.contractorUpdate.mockResolvedValue({
      round: { roundId: 9 },
    } as never);

    await controller.contractorUpdate(
      undefined as unknown as Express.Multer.File,
      { defectId: 7, contractorId: 3, note: 'Fixed' },
      { user: { project_id: 12, role: 'contractor' } } as never,
    );

    expect(storageService.uploadImage).not.toHaveBeenCalled();
    expect(defectsService.contractorUpdate).toHaveBeenCalledWith({
      defectId: 7,
      contractorId: 3,
      note: 'Fixed',
      linkPayload: { project_id: 12, role: 'contractor' },
    });
  });
});
