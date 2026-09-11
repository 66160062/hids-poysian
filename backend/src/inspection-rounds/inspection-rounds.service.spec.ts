import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { InspectionRoundsService } from './inspection-rounds.service';
import { InspectionRound } from './entities/inspection-round.entity';
import { InspectionJob } from 'src/inspection-jobs/entities/inspection-job.entity';
import { InspectionTeamMember } from 'src/inspection-team-members/entities/inspection-team-member.entity';
import { User } from 'src/users/entities/user.entity';
import { Defect } from 'src/defects/entities/defect.entity';
import { ActivityLogsService } from 'src/activity-logs/activity-logs.service';
import { MailService } from 'src/mail/mail.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { AuthService } from 'src/auth/auth.service';
import { ContractorService } from 'src/contractor/contractor.service';
import { StorageService } from 'src/storage/storage.service';
import { PdfService } from 'src/pdf/pdf.service';

function createQueryRunnerMock() {
  return {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      create: jest.fn((_entity, value) => value),
      save: jest.fn((value) => value),
      find: jest.fn().mockResolvedValue([]),
      findOneByOrFail: jest.fn(),
    },
  };
}

describe('InspectionRoundsService', () => {
  let service: InspectionRoundsService;
  let roundsRepo: {
    find: jest.Mock;
    findOne: jest.Mock;
    findOneByOrFail: jest.Mock;
    findOneOrFail: jest.Mock;
    save: jest.Mock;
    softRemove: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let jobsRepo: {
    findOneByOrFail: jest.Mock;
    findOneOrFail: jest.Mock;
    find: jest.Mock;
    save: jest.Mock;
  };
  let defectsRepo: { count: jest.Mock };
  let activityLogsService: { log: jest.Mock; logForRound: jest.Mock };
  let mailService: { sendApprovalEmail: jest.Mock };
  let pdfService: { generateReport: jest.Mock };
  let notificationsService: { create: jest.Mock };
  let authService: { generateLinkToken: jest.Mock };
  let contractorService: { create: jest.Mock; update: jest.Mock };
  let storageService: { uploadImage: jest.Mock };
  let queryRunner: ReturnType<typeof createQueryRunnerMock>;
  let dataSource: { createQueryRunner: jest.Mock };

  beforeEach(async () => {
    roundsRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      findOneByOrFail: jest.fn(),
      findOneOrFail: jest.fn(),
      save: jest.fn(),
      softRemove: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    jobsRepo = {
      findOneByOrFail: jest.fn(),
      findOneOrFail: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
    };
    defectsRepo = { count: jest.fn().mockResolvedValue(0) };
    activityLogsService = { log: jest.fn(), logForRound: jest.fn() };
    mailService = { sendApprovalEmail: jest.fn().mockResolvedValue(undefined) };
    pdfService = {
      generateReport: jest.fn().mockResolvedValue(Buffer.from('%PDF')),
    };
    notificationsService = { create: jest.fn() };
    authService = {
      generateLinkToken: jest.fn().mockResolvedValue({
        url: 'http://localhost:9000/#/view/prj-1?token=mock-token',
      }),
    };
    contractorService = {
      create: jest.fn(),
      update: jest.fn(),
    };
    storageService = {
      uploadImage: jest.fn(),
    };
    queryRunner = createQueryRunnerMock();
    dataSource = { createQueryRunner: jest.fn(() => queryRunner) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InspectionRoundsService,
        { provide: getRepositoryToken(InspectionRound), useValue: roundsRepo },
        { provide: getRepositoryToken(InspectionJob), useValue: jobsRepo },
        { provide: getRepositoryToken(InspectionTeamMember), useValue: {} },
        { provide: getRepositoryToken(User), useValue: {} },
        { provide: getRepositoryToken(Defect), useValue: defectsRepo },
        { provide: DataSource, useValue: dataSource },
        { provide: ActivityLogsService, useValue: activityLogsService },
        { provide: MailService, useValue: mailService },
        { provide: NotificationsService, useValue: notificationsService },
        { provide: AuthService, useValue: authService },
        { provide: ContractorService, useValue: contractorService },
        { provide: StorageService, useValue: storageService },
        { provide: PdfService, useValue: pdfService },
      ],
    }).compile();

    service = module.get<InspectionRoundsService>(InspectionRoundsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('rejects a scheduled date in the past', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      await expect(
        service.create({
          jobId: 1,
          scheduledDate: yesterday.toISOString(),
        } as never),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects creating a new round while the previous one is still open', async () => {
      jobsRepo.findOneByOrFail.mockResolvedValue({ jobId: 1 });
      roundsRepo.findOne.mockResolvedValue({ status: 'SUBMITTED' });

      await expect(
        service.create({ jobId: 1 } as never),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('allows creating a new round once the previous one is approved', async () => {
      jobsRepo.findOneByOrFail.mockResolvedValue({
        jobId: 1,
        status: 'Active',
      });
      roundsRepo.findOne.mockResolvedValue({
        status: 'APPROVED',
        roundId: 5,
        summaryCompletedAt: null,
      });

      const result = await service.create({ jobId: 1 } as never);

      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(result).toMatchObject({ jobId: 1 });
      expect(activityLogsService.log).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ type: 'round_scheduled' }),
        undefined,
      );
    });

    it('rolls back the transaction when saving fails', async () => {
      jobsRepo.findOneByOrFail.mockResolvedValue({
        jobId: 1,
        status: 'Active',
      });
      roundsRepo.findOne.mockResolvedValue(null);
      queryRunner.manager.save.mockRejectedValueOnce(new Error('db error'));

      await expect(service.create({ jobId: 1 } as never)).rejects.toThrow(
        'db error',
      );
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('rejects a scheduled date in the past', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      await expect(
        service.update(1, { scheduledDate: yesterday.toISOString() } as never),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('merges the dto onto the loaded round before saving', async () => {
      roundsRepo.findOneByOrFail.mockResolvedValue({
        roundId: 1,
        status: 'DRAFT',
      });
      roundsRepo.save.mockImplementation((value) => value);

      await expect(
        service.update(1, { status: 'READY' }),
      ).resolves.toMatchObject({ roundId: 1, status: 'READY' });
    });
  });

  describe('submit', () => {
    it('rejects when the inspection has not been confirmed yet', async () => {
      roundsRepo.findOneOrFail.mockResolvedValue({
        roundId: 1,
        inspectedAt: null,
        job: { inspectionType: 'Standard' },
      });

      await expect(service.submit(1)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejects a non-construction round when the summary has not been confirmed', async () => {
      roundsRepo.findOneOrFail.mockResolvedValue({
        roundId: 1,
        inspectedAt: new Date(),
        summaryCompletedAt: null,
        job: { inspectionType: 'Standard' },
      });

      await expect(service.submit(1)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('allows a construction round to submit without a completed summary', async () => {
      roundsRepo.findOneOrFail.mockResolvedValue({
        roundId: 1,
        inspectedAt: new Date(),
        summaryCompletedAt: null,
        job: {
          jobId: 4,
          inspectionType: 'CONSTRUCTION_INSPECTION',
          status: 'Active',
        },
      });
      defectsRepo.count.mockResolvedValueOnce(3);

      const result = await service.submit(1);

      expect(result).toMatchObject({ status: 'SUBMITTED' });
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(activityLogsService.log).toHaveBeenCalledWith(
        4,
        expect.objectContaining({ type: 'round_submitted', sub: '3 รายการ' }),
        1,
      );
    });
  });

  describe('approveReport', () => {
    it('rejects approving a round that has not been submitted', async () => {
      roundsRepo.findOneOrFail.mockResolvedValue({
        roundId: 1,
        status: 'DRAFT',
      });

      await expect(service.approveReport(1)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('marks the job Completed when approving round 2 or later', async () => {
      roundsRepo.findOneOrFail.mockResolvedValue({
        roundId: 1,
        roundNumber: 2,
        status: 'SUBMITTED',
        job: { jobId: 1, status: 'Pending' },
        teamMembers: [{ inspector: { id: 9 } }],
      });

      const { data, notification } = await service.approveReport(1);

      expect(data.job.status).toBe('Completed');
      expect(notification).toMatchObject({
        type: 'REPORT_APPROVED',
        recipientUserId: 9,
      });
      expect(activityLogsService.log).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ type: 'round_approved' }),
        1,
      );
    });

    it('marks the job Active when approving round 1', async () => {
      roundsRepo.findOneOrFail.mockResolvedValue({
        roundId: 1,
        roundNumber: 1,
        status: 'SUBMITTED',
        job: { jobId: 1, status: 'Pending' },
        teamMembers: [],
      });

      const { data } = await service.approveReport(1);

      expect(data.job.status).toBe('Active');
    });

    it('emails the customer the approval with the report PDF attached', async () => {
      roundsRepo.findOneOrFail.mockResolvedValue({
        roundId: 1,
        roundNumber: 2,
        status: 'SUBMITTED',
        job: {
          jobId: 1,
          status: 'Pending',
          projectName: 'บ้านตัวอย่าง',
          customer: { email: 'customer@example.com', fullName: 'คุณลูกค้า' },
        },
        teamMembers: [],
      });

      await service.approveReport(1);
      await new Promise((resolve) => setImmediate(resolve));

      expect(authService.generateLinkToken).toHaveBeenCalledWith(1, 'customer');
      expect(pdfService.generateReport).toHaveBeenCalledWith(1);
      expect(mailService.sendApprovalEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          customerEmail: 'customer@example.com',
          customerName: 'คุณลูกค้า',
          projectName: 'บ้านตัวอย่าง',
          roundNumber: 2,
          tokenUrl: 'http://localhost:9000/#/view/prj-1?token=mock-token',
          pdfBuffer: expect.any(Buffer),
        }),
      );
    });

    it('skips emailing when the job has no customer email on file', async () => {
      roundsRepo.findOneOrFail.mockResolvedValue({
        roundId: 1,
        roundNumber: 1,
        status: 'SUBMITTED',
        job: { jobId: 1, status: 'Pending' },
        teamMembers: [],
      });

      await service.approveReport(1);
      await new Promise((resolve) => setImmediate(resolve));

      expect(pdfService.generateReport).not.toHaveBeenCalled();
      expect(mailService.sendApprovalEmail).not.toHaveBeenCalled();
    });
  });

  describe('confirmInspection / confirmSummary', () => {
    it('stamps inspectedAt on the loaded round', async () => {
      roundsRepo.findOneByOrFail.mockResolvedValue({ roundId: 1 });
      roundsRepo.save.mockImplementation((value) => value);

      const result = await service.confirmInspection(1);

      expect(result.inspectedAt).toBeInstanceOf(Date);
      expect(activityLogsService.logForRound).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ type: 'round_inspected' }),
      );
    });

    it('stamps summaryCompletedAt on the loaded round', async () => {
      roundsRepo.findOneByOrFail.mockResolvedValue({ roundId: 1 });
      roundsRepo.save.mockImplementation((value) => value);

      const result = await service.confirmSummary(1);

      expect(result.summaryCompletedAt).toBeInstanceOf(Date);
    });
  });

  describe('updateJobInfo', () => {
    it('creates a contractor and links it to the job when the job has none yet', async () => {
      roundsRepo.findOneOrFail.mockResolvedValue({
        roundId: 1,
        job: { jobId: 4, contractor: null },
      });
      contractorService.create.mockResolvedValue({
        contractorId: 9,
        fullName: 'สมชาย',
        phoneNumber: '0812345678',
      });
      jobsRepo.findOneOrFail.mockResolvedValue({
        jobId: 4,
        contractor: { contractorId: 9 },
      });

      await service.updateJobInfo(
        1,
        {
          contractorFullName: 'สมชาย',
          contractorPhoneNumber: '0812345678',
        },
        {},
      );

      expect(contractorService.create).toHaveBeenCalledWith({
        fullName: 'สมชาย',
        phoneNumber: '0812345678',
        email: undefined,
        companyName: undefined,
      });
      expect(contractorService.update).not.toHaveBeenCalled();
      expect(jobsRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          jobId: 4,
          contractor: expect.objectContaining({ contractorId: 9 }),
        }),
      );
    });

    it('updates the existing contractor instead of creating a new one', async () => {
      roundsRepo.findOneOrFail.mockResolvedValue({
        roundId: 1,
        job: { jobId: 4, contractor: { contractorId: 9 } },
      });
      jobsRepo.findOneOrFail.mockResolvedValue({ jobId: 4 });

      await service.updateJobInfo(
        1,
        {
          contractorFullName: 'สมชาย 2',
          contractorPhoneNumber: '0898765432',
        },
        {},
      );

      expect(contractorService.update).toHaveBeenCalledWith(9, {
        fullName: 'สมชาย 2',
        phoneNumber: '0898765432',
        email: undefined,
        companyName: undefined,
      });
      expect(contractorService.create).not.toHaveBeenCalled();
    });

    it('skips the contractor entirely when the name/phone are not both provided', async () => {
      roundsRepo.findOneOrFail.mockResolvedValue({
        roundId: 1,
        job: { jobId: 4, contractor: null },
      });
      jobsRepo.findOneOrFail.mockResolvedValue({ jobId: 4 });

      await service.updateJobInfo(1, { contractorFullName: 'สมชาย' }, {});

      expect(contractorService.create).not.toHaveBeenCalled();
      expect(contractorService.update).not.toHaveBeenCalled();
    });

    it('uploads the project image and house plan and stores their returned URLs', async () => {
      roundsRepo.findOneOrFail.mockResolvedValue({
        roundId: 1,
        job: { jobId: 4, contractor: null },
      });
      storageService.uploadImage
        .mockResolvedValueOnce('https://cdn.example.com/project.jpg')
        .mockResolvedValueOnce('https://cdn.example.com/plan.jpg');
      jobsRepo.findOneOrFail.mockResolvedValue({ jobId: 4 });

      const projectImageFile = { buffer: Buffer.from('a') } as Express.Multer.File;
      const housePlanFile = { buffer: Buffer.from('b') } as Express.Multer.File;

      await service.updateJobInfo(1, {}, {
        projectImageUrl: [projectImageFile],
        housePlanUrl: [housePlanFile],
      });

      expect(jobsRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          projectImageUrl: 'https://cdn.example.com/project.jpg',
          housePlanUrl: 'https://cdn.example.com/plan.jpg',
        }),
      );
    });
  });
});
