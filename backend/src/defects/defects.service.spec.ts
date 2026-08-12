import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException } from '@nestjs/common';
import { DefectsService } from './defects.service';
import { Defect, DefectStatus } from './entities/defect.entity';
import { InspectionRound } from 'src/inspection-rounds/entities/inspection-round.entity';

import { DefectSubCategory } from 'src/defect-sub-categories/entities/defect-sub-category.entity';
import { User } from 'src/users/entities/user.entity';
import { ActivityLogsService } from 'src/activity-logs/activity-logs.service';

describe('DefectsService', () => {
  let service: DefectsService;
  let defectsRepo: {
    findOneOrFail: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let activityLogsService: { log: jest.Mock; logForRound: jest.Mock };
  let repoMock: {
    findOneByOrFail: jest.Mock;
    findBy: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOneOrFail: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    defectsRepo = {
      findOneOrFail: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    repoMock = {
      findOneByOrFail: jest.fn(),
      findBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOneOrFail: jest.fn(),
      remove: jest.fn(),
    };
    activityLogsService = { log: jest.fn(), logForRound: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DefectsService,
        { provide: getRepositoryToken(Defect), useValue: defectsRepo },
        { provide: getRepositoryToken(InspectionRound), useValue: repoMock },

        { provide: getRepositoryToken(DefectSubCategory), useValue: repoMock },
        { provide: getRepositoryToken(User), useValue: repoMock },
        { provide: ActivityLogsService, useValue: activityLogsService },
      ],
    }).compile();

    service = module.get<DefectsService>(DefectsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('logs a DEFECT_CREATED activity with the room/sub-room as the location', async () => {
    repoMock.findOneByOrFail.mockResolvedValue({ roundId: 7 });
    repoMock.findBy.mockResolvedValue([]);
    defectsRepo.create.mockImplementation((value) => value);
    defectsRepo.save.mockResolvedValue({ defectId: 99 });
    defectsRepo.findOne.mockResolvedValue({
      defectId: 99,
      round: { roundId: 7 },
      room: { roomName: 'ห้องนั่งเล่น' },
      subRoom: { roomName: 'ห้องนอนชั้น2' },
    });

    await service.create({
      roundId: 7,
      subCategoryIds: [],
      inspectorId: 1,
      roomId: 3,
      floorId: 1,
    } as never);

    expect(activityLogsService.logForRound).toHaveBeenCalledWith(
      7,
      expect.objectContaining({
        type: 'defect_created',
        sub: 'ห้องนั่งเล่น • ห้องนอนชั้น2',
      }),
    );
  });

  it('should update contractor image, note, status, and updatedBy for assigned contractor', async () => {
    const defect = {
      defectId: 11,
      contractorNote: null,
      round: {
        job: {
          jobId: 12,
          status: 'Active',
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
      linkPayload: { project_id: 12, role: 'contractor' },
      note: 'Done',
      contractorImageUrl: '/uploads/defects/done.jpg',
      contractorImageFileSize: 456,
    });

    expect(result).toMatchObject({
      status: DefectStatus.REPAIRED,
      contractorNote: 'Done',
      contractorImageUrl: '/uploads/defects/done.jpg',
      contractorImageFileSize: 456,
      updatedBy: {
        contractorId: 5,
      },
    });
    expect(activityLogsService.log).toHaveBeenCalledWith(
      12,
      expect.objectContaining({ type: 'defect_repaired' }),
      undefined,
    );
  });

  it('should reject contractor update when defect belongs to another contractor', async () => {
    defectsRepo.findOneOrFail.mockResolvedValue({
      defectId: 11,
      round: {
        job: {
          jobId: 12,
          status: 'Active',
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
        linkPayload: { project_id: 12, role: 'contractor' },
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('should reject contractor update when token belongs to another project', async () => {
    defectsRepo.findOneOrFail.mockResolvedValue({
      defectId: 11,
      round: {
        job: {
          jobId: 12,
          status: 'Active',
          contractor: {
            contractorId: 5,
          },
        },
      },
    });

    await expect(
      service.contractorUpdate({
        defectId: 11,
        contractorId: 5,
        linkPayload: { project_id: 99, role: 'contractor' },
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('should reject contractor update for locked jobs', async () => {
    defectsRepo.findOneOrFail.mockResolvedValue({
      defectId: 11,
      round: {
        job: {
          jobId: 12,
          status: 'Locked',
          contractor: {
            contractorId: 5,
          },
        },
      },
    });

    await expect(
      service.contractorUpdate({
        defectId: 11,
        contractorId: 5,
        linkPayload: { project_id: 12, role: 'contractor' },
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
