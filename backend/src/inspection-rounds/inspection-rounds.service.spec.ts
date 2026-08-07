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
  let jobsRepo: { findOneByOrFail: jest.Mock; find: jest.Mock; save: jest.Mock };
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
    jobsRepo = { findOneByOrFail: jest.fn(), find: jest.fn(), save: jest.fn() };
    queryRunner = createQueryRunnerMock();
    dataSource = { createQueryRunner: jest.fn(() => queryRunner) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InspectionRoundsService,
        { provide: getRepositoryToken(InspectionRound), useValue: roundsRepo },
        { provide: getRepositoryToken(InspectionJob), useValue: jobsRepo },
        { provide: getRepositoryToken(InspectionTeamMember), useValue: {} },
        { provide: getRepositoryToken(User), useValue: {} },
        { provide: getRepositoryToken(Defect), useValue: {} },
        { provide: DataSource, useValue: dataSource },
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
      jobsRepo.findOneByOrFail.mockResolvedValue({ jobId: 1, status: 'Active' });
      roundsRepo.findOne.mockResolvedValue({
        status: 'APPROVED',
        roundId: 5,
        summaryCompletedAt: null,
      });

      const result = await service.create({ jobId: 1 } as never);

      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(result).toMatchObject({ jobId: 1 });
    });

    it('rolls back the transaction when saving fails', async () => {
      jobsRepo.findOneByOrFail.mockResolvedValue({ jobId: 1, status: 'Active' });
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
        service.update(1, { status: 'READY' } as never),
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
        job: { inspectionType: 'CONSTRUCTION_INSPECTION', status: 'Active' },
      });

      const result = await service.submit(1);

      expect(result).toMatchObject({ status: 'SUBMITTED' });
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
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
  });

  describe('confirmInspection / confirmSummary', () => {
    it('stamps inspectedAt on the loaded round', async () => {
      roundsRepo.findOneByOrFail.mockResolvedValue({ roundId: 1 });
      roundsRepo.save.mockImplementation((value) => value);

      const result = await service.confirmInspection(1);

      expect(result.inspectedAt).toBeInstanceOf(Date);
    });

    it('stamps summaryCompletedAt on the loaded round', async () => {
      roundsRepo.findOneByOrFail.mockResolvedValue({ roundId: 1 });
      roundsRepo.save.mockImplementation((value) => value);

      const result = await service.confirmSummary(1);

      expect(result.summaryCompletedAt).toBeInstanceOf(Date);
    });
  });
});
