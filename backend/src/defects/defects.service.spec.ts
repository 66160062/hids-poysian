import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException } from '@nestjs/common';
import { DefectsService } from './defects.service';
import { Defect, DefectStatus } from './entities/defect.entity';
import { InspectionRound } from 'src/inspection-rounds/entities/inspection-round.entity';

import { DefectSubCategory } from 'src/defect-sub-categories/entities/defect-sub-category.entity';
import { User } from 'src/users/entities/user.entity';

describe('DefectsService', () => {
  let service: DefectsService;
  let defectsRepo: {
    findOneOrFail: jest.Mock;
    save: jest.Mock;
  };

  beforeEach(async () => {
    defectsRepo = {
      findOneOrFail: jest.fn(),
      save: jest.fn(),
    };
    const repoMock = {
      findOneByOrFail: jest.fn(),
      findBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOneOrFail: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DefectsService,
        { provide: getRepositoryToken(Defect), useValue: defectsRepo },
        { provide: getRepositoryToken(InspectionRound), useValue: repoMock },

        { provide: getRepositoryToken(DefectSubCategory), useValue: repoMock },
        { provide: getRepositoryToken(User), useValue: repoMock },
      ],
    }).compile();

    service = module.get<DefectsService>(DefectsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should update contractor image, note, status, and updatedBy for assigned contractor', async () => {
    const defect = {
      defectId: 11,
      contractorNote: null,
      round: {
        job: {
          contractor: {
            contractorId: 5,
          },
        },
      },
    };
    defectsRepo.findOneOrFail.mockResolvedValue(defect);
    defectsRepo.save.mockImplementation((value) => value);

    const result = await service.contractorUpdate({
      defectId: 11,
      contractorId: 5,
      note: 'Done',
      contractorImageUrl: '/uploads/defects/done.jpg',
      contractorImageFileSize: 456,
    });

    expect(result).toMatchObject({
      status: DefectStatus.FIXED,
      contractorNote: 'Done',
      contractorImageUrl: '/uploads/defects/done.jpg',
      contractorImageFileSize: 456,
      updatedBy: {
        contractorId: 5,
      },
    });
  });

  it('should reject contractor update when defect belongs to another contractor', async () => {
    defectsRepo.findOneOrFail.mockResolvedValue({
      defectId: 11,
      round: {
        job: {
          contractor: {
            contractorId: 5,
          },
        },
      },
    });

    await expect(
      service.contractorUpdate({
        defectId: 11,
        contractorId: 6,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
