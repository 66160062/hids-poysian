import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, ForbiddenException } from '@nestjs/common';
import { DefectsService } from './defects.service';
import { Defect, DefectStatus } from './entities/defect.entity';
import { InspectionRound } from 'src/inspection-rounds/entities/inspection-round.entity';

import { DefectSubCategory } from 'src/defect-sub-categories/entities/defect-sub-category.entity';
import { User } from 'src/users/entities/user.entity';
import { Room } from 'src/rooms/entities/room.entity';
import { SubRoom } from 'src/sub-rooms/entities/sub-room.entity';
import { ActivityLogsService } from 'src/activity-logs/activity-logs.service';
import { NotificationsService } from 'src/notifications/notifications.service';

describe('DefectsService', () => {
  let service: DefectsService;
  let defectsRepo: {
    findOneOrFail: jest.Mock;
    findOne: jest.Mock;
    find: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    count: jest.Mock;
  };
  let activityLogsService: { log: jest.Mock; logForRound: jest.Mock };
  let notificationsService: { create: jest.Mock };
  let repoMock: {
    findOneByOrFail: jest.Mock;
    findOneBy: jest.Mock;
    findBy: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOneOrFail: jest.Mock;
    remove: jest.Mock;
  };
  let roomsRepo: { findOneByOrFail: jest.Mock };
  let subRoomsRepo: { findOneBy: jest.Mock };

  beforeEach(async () => {
    defectsRepo = {
      findOneOrFail: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      save: jest.fn(),
      count: jest.fn(),
    };
    repoMock = {
      findOneByOrFail: jest.fn(),
      findOneBy: jest.fn(),
      findBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOneOrFail: jest.fn(),
      remove: jest.fn(),
    };
    roomsRepo = { findOneByOrFail: jest.fn() };
    subRoomsRepo = { findOneBy: jest.fn() };
    activityLogsService = { log: jest.fn(), logForRound: jest.fn() };
    notificationsService = { create: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DefectsService,
        { provide: getRepositoryToken(Defect), useValue: defectsRepo },
        { provide: getRepositoryToken(InspectionRound), useValue: repoMock },

        { provide: getRepositoryToken(DefectSubCategory), useValue: repoMock },
        { provide: getRepositoryToken(User), useValue: repoMock },
        { provide: getRepositoryToken(Room), useValue: roomsRepo },
        { provide: getRepositoryToken(SubRoom), useValue: subRoomsRepo },
        { provide: ActivityLogsService, useValue: activityLogsService },
        { provide: NotificationsService, useValue: notificationsService },
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
    roomsRepo.findOneByOrFail.mockResolvedValue({
      roomId: 3,
      roomName: 'ห้องนั่งเล่น',
    });
    subRoomsRepo.findOneBy.mockResolvedValue({
      subRoomId: 5,
      roomName: 'ห้องนอนชั้น2',
    });
    defectsRepo.create.mockImplementation((value) => value);
    defectsRepo.save.mockImplementation((value) => ({
      ...value,
      defectId: 99,
    }));

    await service.create({
      roundId: 7,
      subCategoryIds: [],
      inspectorId: 1,
      roomId: 3,
      subRoomId: 5,
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

  it('skips the sub-room lookup and location segment when no sub-room is given', async () => {
    repoMock.findOneByOrFail.mockResolvedValue({ roundId: 7 });
    repoMock.findBy.mockResolvedValue([]);
    roomsRepo.findOneByOrFail.mockResolvedValue({
      roomId: 3,
      roomName: 'ห้องนั่งเล่น',
    });
    defectsRepo.create.mockImplementation((value) => value);
    defectsRepo.save.mockImplementation((value) => ({
      ...value,
      defectId: 99,
    }));

    await service.create({
      roundId: 7,
      subCategoryIds: [],
      inspectorId: 1,
      roomId: 3,
      floorId: 1,
    } as never);

    expect(subRoomsRepo.findOneBy).not.toHaveBeenCalled();
    expect(activityLogsService.logForRound).toHaveBeenCalledWith(
      7,
      expect.objectContaining({
        type: 'defect_created',
        sub: 'ห้องนั่งเล่น',
      }),
    );
  });

  it('throws ConflictException when an identical defect already exists in the round/room', async () => {
    repoMock.findOneByOrFail.mockResolvedValue({ roundId: 7, status: 'DRAFT' });
    repoMock.findBy.mockResolvedValue([]);
    roomsRepo.findOneByOrFail.mockResolvedValue({ roomId: 3 });
    subRoomsRepo.findOneBy.mockResolvedValue({ subRoomId: 5 });
    defectsRepo.find.mockResolvedValue([
      { subCategories: [{ subCategoryId: 2 }, { subCategoryId: 1 }] },
    ]);

    await expect(
      service.create({
        roundId: 7,
        subCategoryIds: [1, 2],
        inspectorId: 1,
        roomId: 3,
        subRoomId: 5,
        floorId: 1,
        severity: 'Minor',
        description: 'ผนังแตกร้าว',
      } as never),
    ).rejects.toThrow(ConflictException);
    expect(defectsRepo.save).not.toHaveBeenCalled();
  });

  it('does not block create when subCategories differ from the existing defect', async () => {
    repoMock.findOneByOrFail.mockResolvedValue({ roundId: 7, status: 'DRAFT' });
    repoMock.findBy.mockResolvedValue([]);
    roomsRepo.findOneByOrFail.mockResolvedValue({ roomId: 3 });
    subRoomsRepo.findOneBy.mockResolvedValue({ subRoomId: 5 });
    defectsRepo.find.mockResolvedValue([
      { subCategories: [{ subCategoryId: 9 }] },
    ]);
    defectsRepo.create.mockImplementation((value) => value);
    defectsRepo.save.mockImplementation((value) => ({
      ...value,
      defectId: 100,
    }));

    await expect(
      service.create({
        roundId: 7,
        subCategoryIds: [1, 2],
        inspectorId: 1,
        roomId: 3,
        subRoomId: 5,
        floorId: 1,
        severity: 'Minor',
        description: 'ผนังแตกร้าว',
      } as never),
    ).resolves.toBeDefined();
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

  it('notifies admin once repaired defects cross the 80% threshold', async () => {
    const defect = {
      defectId: 11,
      status: DefectStatus.PENDING_REPAIR,
      contractorNote: null,
      round: {
        roundId: 7,
        job: {
          jobId: 12,
          projectName: 'บ้านตัวอย่าง',
          status: 'Active',
          contractor: { contractorId: 5 },
        },
      },
    };
    defectsRepo.findOneOrFail.mockResolvedValue(defect);
    defectsRepo.save.mockImplementation((value) => value);
    defectsRepo.count
      .mockResolvedValueOnce(10) // total
      .mockResolvedValueOnce(8); // repaired
    repoMock.findOneBy.mockResolvedValue({ roundId: 7, repairAlertSentAt: null });
    repoMock.save.mockImplementation((value) => value);

    await service.contractorUpdate({
      defectId: 11,
      contractorId: 5,
      linkPayload: { project_id: 12, role: 'contractor' },
      note: 'Done',
    });
    await new Promise((resolve) => setImmediate(resolve));

    expect(repoMock.save).toHaveBeenCalledWith(
      expect.objectContaining({ repairAlertSentAt: expect.any(Date) }),
    );
    expect(notificationsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientRole: 'admin',
        jobId: 12,
        roundId: 7,
      }),
    );
  });

  it('does not notify admin when below the 80% threshold', async () => {
    const defect = {
      defectId: 11,
      status: DefectStatus.PENDING_REPAIR,
      contractorNote: null,
      round: {
        roundId: 7,
        job: {
          jobId: 12,
          projectName: 'บ้านตัวอย่าง',
          status: 'Active',
          contractor: { contractorId: 5 },
        },
      },
    };
    defectsRepo.findOneOrFail.mockResolvedValue(defect);
    defectsRepo.save.mockImplementation((value) => value);
    defectsRepo.count.mockResolvedValueOnce(10).mockResolvedValueOnce(5);
    repoMock.findOneBy.mockResolvedValue({ roundId: 7, repairAlertSentAt: null });

    await service.contractorUpdate({
      defectId: 11,
      contractorId: 5,
      linkPayload: { project_id: 12, role: 'contractor' },
    });
    await new Promise((resolve) => setImmediate(resolve));

    expect(notificationsService.create).not.toHaveBeenCalled();
  });

  it('does not notify admin twice for the same round', async () => {
    const defect = {
      defectId: 11,
      status: DefectStatus.PENDING_REPAIR,
      contractorNote: null,
      round: {
        roundId: 7,
        job: {
          jobId: 12,
          projectName: 'บ้านตัวอย่าง',
          status: 'Active',
          contractor: { contractorId: 5 },
        },
      },
    };
    defectsRepo.findOneOrFail.mockResolvedValue(defect);
    defectsRepo.save.mockImplementation((value) => value);
    repoMock.findOneBy.mockResolvedValue({
      roundId: 7,
      repairAlertSentAt: new Date(),
    });

    await service.contractorUpdate({
      defectId: 11,
      contractorId: 5,
      linkPayload: { project_id: 12, role: 'contractor' },
    });
    await new Promise((resolve) => setImmediate(resolve));

    expect(defectsRepo.count).not.toHaveBeenCalled();
    expect(notificationsService.create).not.toHaveBeenCalled();
  });

  it('does not re-check the threshold when the defect was already repaired', async () => {
    const defect = {
      defectId: 11,
      status: DefectStatus.REPAIRED,
      contractorNote: null,
      round: {
        roundId: 7,
        job: {
          jobId: 12,
          projectName: 'บ้านตัวอย่าง',
          status: 'Active',
          contractor: { contractorId: 5 },
        },
      },
    };
    defectsRepo.findOneOrFail.mockResolvedValue(defect);
    defectsRepo.save.mockImplementation((value) => value);

    await service.contractorUpdate({
      defectId: 11,
      contractorId: 5,
      linkPayload: { project_id: 12, role: 'contractor' },
      note: 'Updated note only',
    });
    await new Promise((resolve) => setImmediate(resolve));

    expect(repoMock.findOneBy).not.toHaveBeenCalled();
    expect(notificationsService.create).not.toHaveBeenCalled();
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

  it('should reject creating a defect on a submitted round', async () => {
    repoMock.findOneByOrFail.mockResolvedValue({
      roundId: 7,
      status: 'SUBMITTED',
    });
    repoMock.findBy.mockResolvedValue([]);
    roomsRepo.findOneByOrFail.mockResolvedValue({ roomId: 3 });

    await expect(
      service.create({
        roundId: 7,
        subCategoryIds: [],
        inspectorId: 1,
        roomId: 3,
        floorId: 1,
      } as never),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(defectsRepo.save).not.toHaveBeenCalled();
  });

  it('should reject updating a defect on an approved round', async () => {
    defectsRepo.findOneOrFail.mockResolvedValue({
      defectId: 11,
      round: { roundId: 7, status: 'APPROVED' },
    });

    await expect(
      service.update(11, { description: 'edited' } as never),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(defectsRepo.save).not.toHaveBeenCalled();
  });

  it('should reject removing a defect on a submitted round', async () => {
    defectsRepo.findOneOrFail.mockResolvedValue({
      defectId: 11,
      round: { roundId: 7, status: 'SUBMITTED' },
    });

    await expect(service.remove(11)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('should allow updating a defect on a round that is not locked', async () => {
    const defect = {
      defectId: 11,
      description: 'old',
      round: { roundId: 7, status: 'SCHEDULED' },
    };
    defectsRepo.findOneOrFail.mockResolvedValue(defect);
    defectsRepo.save.mockImplementation((value) => value);

    const result = await service.update(11, {
      description: 'edited',
    } as never);

    expect(result.description).toBe('edited');
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
