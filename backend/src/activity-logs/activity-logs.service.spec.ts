import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ActivityLogsService } from './activity-logs.service';
import { ActivityLog, ActivityLogType } from './entities/activity-log.entity';
import { InspectionRound } from 'src/inspection-rounds/entities/inspection-round.entity';

describe('ActivityLogsService', () => {
  let service: ActivityLogsService;
  let activityLogRepo: {
    create: jest.Mock;
    save: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let queryBuilder: {
    distinctOn: jest.Mock;
    select: jest.Mock;
    addSelect: jest.Mock;
    where: jest.Mock;
    orderBy: jest.Mock;
    addOrderBy: jest.Mock;
    getRawMany: jest.Mock;
  };
  let roundsRepo: { findOne: jest.Mock };

  beforeEach(async () => {
    queryBuilder = {
      distinctOn: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
    };
    activityLogRepo = {
      create: jest.fn((value) => value),
      save: jest.fn((value) => value),
      createQueryBuilder: jest.fn(() => queryBuilder),
    };
    roundsRepo = { findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivityLogsService,
        { provide: getRepositoryToken(ActivityLog), useValue: activityLogRepo },
        { provide: getRepositoryToken(InspectionRound), useValue: roundsRepo },
      ],
    }).compile();

    service = module.get<ActivityLogsService>(ActivityLogsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('log', () => {
    it('saves an entry referencing the given job and round', async () => {
      const result = await service.log(
        12,
        {
          type: ActivityLogType.ROUND_APPROVED,
          color: 'green',
          title: 'ลูกค้าอนุมัติรายงานรอบที่ 1 แล้ว',
        },
        5,
      );

      expect(result).toMatchObject({
        type: ActivityLogType.ROUND_APPROVED,
        color: 'green',
        title: 'ลูกค้าอนุมัติรายงานรอบที่ 1 แล้ว',
        job: { jobId: 12 },
        round: { roundId: 5 },
      });
    });

    it('returns null instead of throwing when the repository save fails', async () => {
      activityLogRepo.save.mockRejectedValueOnce(new Error('db error'));

      await expect(
        service.log(12, {
          type: ActivityLogType.DEFECT_CREATED,
          color: 'purple',
          title: 'พบข้อบกพร่องใหม่',
        }),
      ).resolves.toBeNull();
    });
  });

  describe('logForRound', () => {
    it('resolves jobId from the round before writing the log', async () => {
      roundsRepo.findOne.mockResolvedValue({
        roundId: 5,
        job: { jobId: 12 },
      });

      const result = await service.logForRound(5, {
        type: ActivityLogType.ROUND_INSPECTED,
        color: 'blue',
        title: 'วิศวกรเข้าตรวจรอบที่ 1 เสร็จสิ้น',
      });

      expect(result).toMatchObject({
        job: { jobId: 12 },
        round: { roundId: 5 },
      });
    });

    it('returns null when the round has no linked job', async () => {
      roundsRepo.findOne.mockResolvedValue(null);

      const result = await service.logForRound(999, {
        type: ActivityLogType.ROUND_INSPECTED,
        color: 'blue',
        title: 'วิศวกรเข้าตรวจรอบที่ 1 เสร็จสิ้น',
      });

      expect(result).toBeNull();
      expect(activityLogRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('findByJob', () => {
    it('queries logs scoped to the job via distinct-on query builder', async () => {
      await service.findByJob(12);

      expect(activityLogRepo.createQueryBuilder).toHaveBeenCalledWith('log');
      expect(queryBuilder.distinctOn).toHaveBeenCalledWith([
        'log.type',
        'DATE(log.createdAt)',
      ]);
      expect(queryBuilder.where).toHaveBeenCalledWith('log.job = :jobId', {
        jobId: 12,
      });
    });

    it('appends the event count to the title when more than one happened that day', async () => {
      queryBuilder.getRawMany.mockResolvedValue([
        {
          activityId: 3,
          type: ActivityLogType.DEFECT_CREATED,
          color: 'purple',
          title: 'พบข้อบกพร่องใหม่',
          sub: 'ห้องนอน 2',
          createdAt: new Date('2026-08-12T10:00:00Z'),
          eventCount: '5',
        },
      ]);

      const result = await service.findByJob(12);

      expect(result).toEqual([
        expect.objectContaining({
          activityId: 3,
          title: 'พบข้อบกพร่องใหม่ 5 จุด',
          sub: 'ห้องนอน 2',
        }),
      ]);
    });

    it('leaves the title untouched when only one event happened that day', async () => {
      queryBuilder.getRawMany.mockResolvedValue([
        {
          activityId: 1,
          type: ActivityLogType.DEFECT_CREATED,
          color: 'purple',
          title: 'พบข้อบกพร่องใหม่',
          sub: 'ห้องนอน 2',
          createdAt: new Date('2026-08-12T10:00:00Z'),
          eventCount: '1',
        },
      ]);

      const result = await service.findByJob(12);

      expect(result[0].title).toBe('พบข้อบกพร่องใหม่');
    });

    it('does not append a count for event types outside the countable set', async () => {
      queryBuilder.getRawMany.mockResolvedValue([
        {
          activityId: 2,
          type: ActivityLogType.ROUND_APPROVED,
          color: 'green',
          title: 'ลูกค้าอนุมัติรายงานรอบที่ 1 แล้ว',
          sub: null,
          createdAt: new Date('2026-08-12T10:00:00Z'),
          eventCount: '3',
        },
      ]);

      const result = await service.findByJob(12);

      expect(result[0].title).toBe('ลูกค้าอนุมัติรายงานรอบที่ 1 แล้ว');
    });

    it('sorts merged rows newest first', async () => {
      queryBuilder.getRawMany.mockResolvedValue([
        {
          activityId: 1,
          type: ActivityLogType.ROUND_APPROVED,
          color: 'green',
          title: 'เก่ากว่า',
          sub: null,
          createdAt: new Date('2026-08-10T09:00:00Z'),
          eventCount: '1',
        },
        {
          activityId: 2,
          type: ActivityLogType.DEFECT_CREATED,
          color: 'purple',
          title: 'ใหม่กว่า',
          sub: null,
          createdAt: new Date('2026-08-12T09:00:00Z'),
          eventCount: '1',
        },
      ]);

      const result = await service.findByJob(12);

      expect(result.map((r) => r.activityId)).toEqual([2, 1]);
    });
  });
});
