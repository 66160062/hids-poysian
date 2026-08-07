import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { InspectionJob } from '../inspection-jobs/entities/inspection-job.entity';
import { InspectionRound } from '../inspection-rounds/entities/inspection-round.entity';
import { Defect } from '../defects/entities/defect.entity';

describe('AdminService', () => {
  let service: AdminService;
  let jobsRepo: { find: jest.Mock; save: jest.Mock };
  let roundsRepo: { find: jest.Mock };
  let defectsRepo: { find: jest.Mock };

  beforeEach(async () => {
    jobsRepo = { find: jest.fn(), save: jest.fn() };
    roundsRepo = { find: jest.fn() };
    defectsRepo = { find: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: getRepositoryToken(InspectionJob), useValue: jobsRepo },
        { provide: getRepositoryToken(InspectionRound), useValue: roundsRepo },
        { provide: getRepositoryToken(Defect), useValue: defectsRepo },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDashboardData', () => {
    it('counts jobs by house type and in-progress status, and classifies construction jobs', async () => {
      jobsRepo.find.mockImplementation(({ relations }: { relations: string[] }) => {
        if (relations?.includes('houseType')) {
          return Promise.resolve([
            { status: 'Active', inspectionType: '', houseType: { name: 'บ้านเดี่ยว' } },
            { status: 'Draft', inspectionType: '', houseType: { name: 'ทาวน์โฮม' } },
            { status: 'Completed', inspectionType: '', houseType: { name: 'คอนโด' } },
            { status: 'Active', inspectionType: 'CONSTRUCTION_INSPECTION', houseType: null },
          ]);
        }
        return Promise.resolve([]);
      });
      roundsRepo.find.mockResolvedValue([]);

      const result = await service.getDashboardData('2026-08-01');

      expect(result).toMatchObject({
        totalProjects: 4,
        inProgress: 3,
        singleHouse: 1,
        townhouse: 1,
        condo: 1,
        construction: 1,
      });
    });

    it('builds one calendar entry per scheduled round in the target month', async () => {
      jobsRepo.find.mockResolvedValue([]);
      roundsRepo.find.mockResolvedValue([
        { scheduledDate: new Date('2026-08-05T10:00:00+07:00') },
        { scheduledDate: null },
      ]);

      const result = await service.getDashboardData('2026-08-01');

      expect(result.calendarEvents).toEqual([5]);
    });

    it('falls back to placeholder text for a recent job with no rounds yet', async () => {
      jobsRepo.find.mockImplementation(({ relations }: { relations: string[] }) => {
        if (relations?.includes('rounds')) {
          return Promise.resolve([
            {
              jobId: 1,
              projectName: 'บ้านทดสอบ',
              status: 'Draft',
              inspectionType: '',
              createdAt: new Date('2026-08-01T00:00:00+07:00'),
              houseType: null,
              customer: null,
              rounds: [],
            },
          ]);
        }
        return Promise.resolve([]);
      });
      roundsRepo.find.mockResolvedValue([]);

      const result = await service.getDashboardData('2026-08-01');

      expect(result.tasks[0]).toMatchObject({
        team: 'ยังไม่ระบุทีม',
        customer: 'ยังไม่ระบุลูกค้า',
        status: 'ร่าง (Draft)',
      });
    });
  });

  describe('getAllWorkList', () => {
    it('labels a job with an approved second round as finished with its round number', async () => {
      jobsRepo.find.mockResolvedValue([
        {
          jobId: 1,
          projectName: 'บ้านทดสอบ',
          houseType: null,
          usableArea: 120,
          customer: null,
          createdAt: new Date('2026-08-01T00:00:00Z'),
        },
      ]);
      roundsRepo.find.mockResolvedValue([
        {
          job: { jobId: 1 },
          status: 'APPROVED',
          roundNumber: 2,
          scheduledDate: new Date('2026-08-05T00:00:00Z'),
          teamMembers: [],
        },
      ]);

      const result = await service.getAllWorkList();

      expect(result[0]).toMatchObject({
        status: 'เสร็จสิ้น 2',
        statusKey: 'others',
      });
    });

    it('falls back to the job status when the job has no round yet', async () => {
      jobsRepo.find.mockResolvedValue([
        {
          jobId: 2,
          projectName: 'บ้านทดสอบ 2',
          houseType: null,
          usableArea: 80,
          customer: null,
          status: 'Cancelled',
          createdAt: new Date('2026-08-01T00:00:00Z'),
        },
      ]);
      roundsRepo.find.mockResolvedValue([]);

      const result = await service.getAllWorkList();

      expect(result[0]).toMatchObject({ status: 'ยกเลิก', statusKey: 'others' });
    });
  });

  describe('syncJobStatuses', () => {
    it('skips jobs that have no rounds at all', async () => {
      jobsRepo.find.mockResolvedValue([{ jobId: 1, status: 'Draft', rounds: [] }]);

      await expect(service.syncJobStatuses()).resolves.toEqual({ synced: 0 });
      expect(jobsRepo.save).not.toHaveBeenCalled();
    });

    it('updates a job to Completed when its latest round is approved with roundNumber >= 2', async () => {
      jobsRepo.find.mockResolvedValue([
        {
          jobId: 1,
          status: 'Pending',
          rounds: [
            { roundId: 1, roundNumber: 1, status: 'APPROVED' },
            { roundId: 2, roundNumber: 2, status: 'APPROVED' },
          ],
        },
      ]);
      jobsRepo.save.mockImplementation((value) => value);

      const result = await service.syncJobStatuses();

      expect(result).toEqual({ synced: 1 });
      expect(jobsRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'Completed' }),
      );
    });

    it('does not re-save a job whose status already matches the expected status', async () => {
      jobsRepo.find.mockResolvedValue([
        {
          jobId: 1,
          status: 'Pending',
          rounds: [{ roundId: 1, roundNumber: 1, status: 'SUBMITTED' }],
        },
      ]);

      const result = await service.syncJobStatuses();

      expect(result).toEqual({ synced: 0 });
      expect(jobsRepo.save).not.toHaveBeenCalled();
    });
  });
});
