import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { ConstructionDailyReportsService } from './construction-daily-reports.service';
import { CreateConstructionDailyReportDto } from './dto/create-construction-daily-report.dto';
import { PersonnelType } from './entities/daily-personnel.entity';

describe('ConstructionDailyReportsService', () => {
  let service: ConstructionDailyReportsService;
  let mockDataSource: {
    transaction: jest.Mock;
    getRepository: jest.Mock;
  };

  // Factory สำหรับสร้าง mock EntityManager ที่ใช้ใน transaction callback
  const createMockManager = (overrides?: {
    roundFindOneBy?: jest.Mock;
  }): EntityManager => {
    const savedReport = {
      dailyReportId: 1,
      reportDate: '2026-06-19',
      weather: 'Sunny',
      workingPeriod: '08:00 - 17:00',
    };

    const fullReport = {
      ...savedReport,
      workItems: [{ workItemId: 1, description: 'เทปูน' }],
      personnels: [
        {
          personnelId: 1,
          name: 'ช่างไม้',
          type: PersonnelType.WORKER,
          count: 3,
        },
      ],
      issues: [{ issueId: 1, description: 'ปูนขาด', note: 'รอดำเนินการ' }],
    };

    const repoMocks: Record<string, Record<string, jest.Mock>> = {};

    const getRepoMock = (entityClass: { name: string }) => {
      const name = entityClass.name;
      if (!repoMocks[name]) {
        repoMocks[name] = {
          findOneBy: jest.fn(),
          findOneOrFail: jest.fn(),
          create: jest.fn((data: Record<string, unknown>) => data),
          save: jest.fn(
            (data: Record<string, unknown> | Record<string, unknown>[]) =>
              Array.isArray(data) ? data : { ...data, ...savedReport },
          ),
        };
      }
      return repoMocks[name];
    };

    const manager = {
      getRepository: jest.fn((entityClass: { name: string }) => {
        const repo = getRepoMock(entityClass);

        // Override สำหรับ InspectionRound.findOneBy
        if (entityClass.name === 'InspectionRound') {
          repo.findOneBy =
            overrides?.roundFindOneBy ??
            jest.fn().mockResolvedValue({ roundId: 1 });
        }

        // Override สำหรับ ConstructionDailyReport.findOneOrFail
        if (entityClass.name === 'ConstructionDailyReport') {
          repo.findOneOrFail = jest.fn().mockResolvedValue(fullReport);
        }

        return repo;
      }),
    } as unknown as EntityManager;

    return manager;
  };

  beforeEach(async () => {
    mockDataSource = {
      transaction: jest.fn(),
      getRepository: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConstructionDailyReportsService,
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<ConstructionDailyReportsService>(
      ConstructionDailyReportsService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const validDto: CreateConstructionDailyReportDto = {
      roundId: 1,
      reportDate: '2026-06-19',
      weather: 'Sunny',
      workingPeriod: '08:00 - 17:00',
      workItems: [
        {
          description: 'เทปูนพื้น',
          location: 'ห้องรับแขก',
          unit: 'ตร.ม.',
          actualPercent: 80,
        },
      ],
      personnels: [
        { name: 'ช่างไม้', type: PersonnelType.WORKER, count: 3 },
        { name: 'วิศวกรสนาม', type: PersonnelType.PERSONNEL, count: 1 },
      ],
      issues: [{ description: 'ปูนขาด', note: 'รอดำเนินการ' }],
    };

    it('should create daily report with all child entities in a transaction', async () => {
      const manager = createMockManager();

      mockDataSource.transaction.mockImplementation(
        async (cb: (manager: EntityManager) => Promise<unknown>) => cb(manager),
      );

      const result = await service.create(validDto);

      // ตรวจว่า transaction ถูกเรียก
      expect(mockDataSource.transaction).toHaveBeenCalledTimes(1);

      // ตรวจว่า getRepository ถูกเรียกสำหรับ entity ต่างๆ
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(manager.getRepository).toHaveBeenCalled();

      // ตรวจว่า result มี relations กลับมา
      expect(result).toHaveProperty('workItems');
      expect(result).toHaveProperty('personnels');
      expect(result).toHaveProperty('issues');
    });

    it('should throw NotFoundException when round does not exist', async () => {
      const manager = createMockManager({
        roundFindOneBy: jest.fn().mockResolvedValue(null),
      });

      mockDataSource.transaction.mockImplementation(
        async (cb: (manager: EntityManager) => Promise<unknown>) => cb(manager),
      );

      await expect(service.create(validDto)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('should create report without optional child entities', async () => {
      const dtoWithoutChildren: CreateConstructionDailyReportDto = {
        roundId: 1,
        reportDate: '2026-06-19',
        weather: 'Rainy',
      };

      const manager = createMockManager();

      mockDataSource.transaction.mockImplementation(
        async (cb: (manager: EntityManager) => Promise<unknown>) => cb(manager),
      );

      const result = await service.create(dtoWithoutChildren);

      expect(mockDataSource.transaction).toHaveBeenCalledTimes(1);
      expect(result).toBeDefined();
    });

    it('should propagate errors and rollback transaction', async () => {
      mockDataSource.transaction.mockRejectedValue(
        new Error('Database connection lost'),
      );

      await expect(service.create(validDto)).rejects.toThrow(
        'Database connection lost',
      );
    });
  });

  describe('findByRound', () => {
    it('should throw NotFoundException when no report exists for roundId', async () => {
      const repoMock = {
        findOne: jest.fn().mockResolvedValue(null),
      };
      mockDataSource.getRepository = jest.fn().mockReturnValue(repoMock);

      await expect(service.findByRound(999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('should return report with all relations when found', async () => {
      const expectedReport = {
        dailyReportId: 1,
        reportDate: '2026-06-19',
        workItems: [{ workItemId: 1 }],
        personnels: [{ personnelId: 1 }],
        issues: [{ issueId: 1 }],
      };

      const repoMock = {
        findOne: jest.fn().mockResolvedValue(expectedReport),
      };
      mockDataSource.getRepository = jest.fn().mockReturnValue(repoMock);

      const result = await service.findByRound(1);

      expect(result).toEqual(expectedReport);
      expect(repoMock.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { round: { roundId: 1 } },
          relations: ['round', 'workItems', 'personnels', 'issues'],
        }),
      );
    });
  });
});
