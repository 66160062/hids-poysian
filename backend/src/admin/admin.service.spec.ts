import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { InspectionJob } from '../inspection-jobs/entities/inspection-job.entity';
import { InspectionRound } from '../inspection-rounds/entities/inspection-round.entity';
import { Defect } from '../defects/entities/defect.entity';
import { Branch } from '../branches/entities/branch.entity';
import { Team } from '../teams/entities/team.entity';

describe('AdminService', () => {
  let service: AdminService;
  let jobsRepo: { find: jest.Mock; save: jest.Mock };
  let roundsRepo: { find: jest.Mock };
  let defectsRepo: { find: jest.Mock };
  let teamsRepo: { find: jest.Mock };

  beforeEach(async () => {
    jobsRepo = { find: jest.fn(), save: jest.fn() };
    roundsRepo = { find: jest.fn().mockResolvedValue([]) };
    defectsRepo = { find: jest.fn().mockResolvedValue([]) };
    teamsRepo = { find: jest.fn().mockResolvedValue([]) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: getRepositoryToken(InspectionJob), useValue: jobsRepo },
        { provide: getRepositoryToken(InspectionRound), useValue: roundsRepo },
        { provide: getRepositoryToken(Defect), useValue: defectsRepo },
        {
          provide: getRepositoryToken(Branch),
          useValue: {
            find: jest.fn().mockResolvedValue([]),
            create: jest.fn((row: unknown) => row),
            save: jest.fn((rows: unknown) => Promise.resolve(rows)),
          },
        },
        {
          provide: getRepositoryToken(Team),
          useValue: teamsRepo,
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDashboardData', () => {
    it('counts jobs by house type and in-progress status, and classifies construction jobs', async () => {
      jobsRepo.find.mockImplementation(
        ({ relations }: { relations: string[] }) => {
          if (relations?.includes('houseType')) {
            return Promise.resolve([
              {
                status: 'Active',
                inspectionType: '',
                houseType: { name: 'บ้านเดี่ยว' },
              },
              {
                status: 'Draft',
                inspectionType: '',
                houseType: { name: 'ทาวน์โฮม' },
              },
              {
                status: 'Completed',
                inspectionType: '',
                houseType: { name: 'คอนโด' },
              },
              {
                status: 'Active',
                inspectionType: 'CONSTRUCTION_INSPECTION',
                houseType: null,
              },
            ]);
          }
          return Promise.resolve([]);
        },
      );
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
      jobsRepo.find.mockImplementation(
        ({ relations }: { relations: string[] }) => {
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
        },
      );
      roundsRepo.find.mockResolvedValue([]);

      const result = await service.getDashboardData('2026-08-01');

      expect(result.tasks[0]).toMatchObject({
        team: 'ยังไม่ระบุทีม',
        customer: 'ยังไม่ระบุลูกค้า',
        status: 'ร่าง',
        statusCode: 'DRAFT',
        roundNumber: null,
        referenceDate: '2026-07-31T17:00:00.000Z',
      });
    });

    it('sends a language-neutral status code and round number for a closed job', async () => {
      jobsRepo.find.mockImplementation(
        ({ relations }: { relations: string[] }) => {
          if (relations?.includes('rounds')) {
            return Promise.resolve([
              {
                jobId: 1,
                projectName: 'บ้านทดสอบ',
                status: 'Completed',
                inspectionType: '',
                createdAt: new Date('2026-08-01T00:00:00+07:00'),
                houseType: null,
                customer: null,
                rounds: [
                  {
                    roundId: 5,
                    roundNumber: 2,
                    status: 'APPROVED',
                    scheduledDate: null,
                    teamMembers: [],
                  },
                ],
              },
            ]);
          }
          return Promise.resolve([]);
        },
      );
      roundsRepo.find.mockResolvedValue([]);

      const result = await service.getDashboardData('2026-08-01');

      expect(result.tasks[0]).toMatchObject({
        status: 'เสร็จสิ้น 2',
        statusCode: 'COMPLETED',
        roundNumber: 2,
      });
    });

    it('keys the status breakdown by status code in display order', async () => {
      jobsRepo.find.mockImplementation(
        ({ take }: { take?: number }) => {
          if (!take) {
            return Promise.resolve([
              { status: 'Draft', inspectionType: '', houseType: null },
              { status: 'Active', inspectionType: '', houseType: null },
              { status: 'Active', inspectionType: '', houseType: null },
            ]);
          }
          return Promise.resolve([]);
        },
      );
      roundsRepo.find.mockResolvedValue([]);

      const result = await service.getDashboardData('2026-08-01');

      expect(result.homeStatusBreakdown).toEqual([
        { status: 'กำลังดำเนินการ', statusCode: 'IN_PROGRESS', count: 2 },
        { status: 'ร่าง', statusCode: 'DRAFT', count: 1 },
      ]);
    });

    it('aggregates defects from latest rounds without duplicates and maps drilldowns', async () => {
      jobsRepo.find.mockImplementation(
        ({ relations }: { relations?: string[] }) => {
          if (relations?.includes('rounds')) {
            return Promise.resolve([
              {
                jobId: 10,
                projectName: 'โครงการ A',
                status: 'Active',
                inspectionType: 'ตรวจบ้าน',
                customer: { fullName: 'คุณสมชาย' },
                rounds: [
                  { roundId: 101, roundNumber: 1, scheduledDate: null, teamMembers: [] },
                  { roundId: 102, roundNumber: 2, status: 'SCHEDULED', completionPercent: 80, scheduledDate: null, teamMembers: [] },
                ],
              },
              {
                jobId: 20,
                projectName: 'โครงการ B',
                status: 'Pending',
                inspectionType: 'ตรวจบ้าน',
                customer: { fullName: 'คุณสมหญิง' },
                rounds: [
                  { roundId: 201, roundNumber: 1, status: 'SUBMITTED', completionPercent: 95, scheduledDate: null, teamMembers: [] },
                ],
              },
            ]);
          }
          return Promise.resolve([]);
        },
      );

      defectsRepo.find.mockResolvedValue([
        {
          defectId: 1,
          status: 'verified',
          round: { roundId: 102, job: { jobId: 10 } },
          subCategories: [
            { name: 'งานสี', category: { name: 'งานโครงสร้าง', nameEn: 'Structure' } },
            { name: 'รอยร้าว', category: { name: 'งานโครงสร้าง', nameEn: 'Structure' } },
          ],
        },
        {
          defectId: 2,
          status: 'pending_repair',
          round: { roundId: 102, job: { jobId: 10 } },
          subCategories: [
            { name: 'ท่อน้ำตัน', category: { name: 'งานสุขาภิบาล', nameEn: 'Sanitary' } },
          ],
        },
      ]);

      const result = await service.getDashboardData('2026-08-01');

      expect(defectsRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            round: {
              roundId: expect.anything(),
            },
          },
        }),
      );

      expect(result.totalDefects).toBe(2);
      expect(result.overallDefectResolution).toEqual({
        verified: 1,
        repaired: 0,
        pending: 1,
        total: 2,
        completionRate: 50,
      });

      expect(result.topDefectCategories).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ categoryName: 'งานโครงสร้าง', count: 1, percentage: 50 }),
          expect.objectContaining({ categoryName: 'งานสุขาภิบาล', count: 1, percentage: 50 }),
        ]),
      );

      expect(result.jobDrilldowns).toHaveLength(2);
      // โครงการ A: ยังไม่ได้ส่งคำขออนุมัติ (SCHEDULED) -> completionScore ต้องเป็น null
      expect(result.jobDrilldowns[0]).toMatchObject({
        jobId: 10,
        title: 'โครงการ A',
        completionScore: null,
      });
      // โครงการ B: ส่งคำขออนุมัติแล้ว (SUBMITTED) -> completionScore ต้องแสดง 95
      expect(result.jobDrilldowns[1]).toMatchObject({
        jobId: 20,
        title: 'โครงการ B',
        completionScore: 95,
      });
    });

    it('filters team workloads strictly by branch without including foreign branch teams', async () => {
      // Mock active teams for branch 1 only
      teamsRepo.find.mockResolvedValue([
        { team_Id: 1, team_name: 'ทีมชลบุรี A', branchId: 1, status: 'active' },
      ]);

      jobsRepo.find.mockImplementation(
        ({ relations }: { relations?: string[] }) => {
          if (relations?.includes('rounds')) {
            return Promise.resolve([
              // Job 1 assigned to Team 1 (Branch 1) - Scheduled (Pending)
              {
                jobId: 1,
                status: 'Draft',
                rounds: [
                  {
                    roundId: 1,
                    roundNumber: 1,
                    status: 'SCHEDULED',
                    teamMembers: [{ team: { team_Id: 1, team_name: 'ทีมชลบุรี A' } }],
                  },
                ],
              },
              // Job 3 assigned to Team 1 (Branch 1) - Active
              {
                jobId: 3,
                status: 'Active',
                rounds: [
                  {
                    roundId: 3,
                    roundNumber: 1,
                    status: 'IN_PROGRESS',
                    teamMembers: [{ team: { team_Id: 1, team_name: 'ทีมชลบุรี A' } }],
                  },
                ],
              },
              // Job 2 assigned to Team 2 (Branch 2 - foreign)
              {
                jobId: 2,
                status: 'Active',
                rounds: [
                  {
                    roundId: 2,
                    roundNumber: 1,
                    teamMembers: [{ team: { team_Id: 2, team_name: 'ทีมระยอง B' } }],
                  },
                ],
              },
            ]);
          }
          return Promise.resolve([]);
        },
      );

      const result = await service.getDashboardData('2026-08-01', 1);

      // Should only contain Team 1 and NOT Team 2
      expect(result.teamWorkloads).toEqual([
        {
          teamId: 1,
          teamName: 'ทีมชลบุรี A',
          scheduledCount: 1,
          inProgressCount: 1,
          pendingApprovalCount: 0,
          completedCount: 0,
          totalCount: 2,
        },
      ]);
    });
  });

  describe('getAllWorkList', () => {
    it('labels a closed job as finished with its latest round number', async () => {
      jobsRepo.find.mockResolvedValue([
        {
          jobId: 1,
          projectName: 'บ้านทดสอบ',
          houseType: null,
          usableArea: 120,
          customer: null,
          status: 'Completed',
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

    it('keeps a job in progress when its round is approved but the job is not closed', async () => {
      jobsRepo.find.mockResolvedValue([
        {
          jobId: 1,
          projectName: 'บ้านทดสอบ',
          houseType: null,
          usableArea: 120,
          customer: null,
          status: 'Active',
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
        status: 'กำลังดำเนินการ',
        statusKey: 'in_progress',
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

      expect(result[0]).toMatchObject({
        status: 'ยกเลิก',
        statusKey: 'others',
      });
    });
  });

  describe('syncJobStatuses', () => {
    it('skips jobs that have no rounds at all', async () => {
      jobsRepo.find.mockResolvedValue([
        { jobId: 1, status: 'Draft', rounds: [] },
      ]);

      await expect(service.syncJobStatuses()).resolves.toEqual({ synced: 0 });
      expect(jobsRepo.save).not.toHaveBeenCalled();
    });

    it('does not promote a job to Completed just because a later round is approved', async () => {
      jobsRepo.find.mockResolvedValue([
        {
          jobId: 1,
          status: 'Pending',
          completedAt: null,
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
        expect.objectContaining({ status: 'Active', completedAt: null }),
      );
    });

    it('backfills completedAt from the latest approval for a job closed before the column existed', async () => {
      const approvedAt = new Date('2026-08-10T00:00:00Z');
      jobsRepo.find.mockResolvedValue([
        {
          jobId: 1,
          status: 'Completed',
          completedAt: null,
          rounds: [
            { roundId: 2, roundNumber: 2, status: 'APPROVED', approvedAt },
          ],
        },
      ]);
      jobsRepo.save.mockImplementation((value) => value);

      const result = await service.syncJobStatuses();

      expect(result).toEqual({ synced: 1 });
      expect(jobsRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'Completed', completedAt: approvedAt }),
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
