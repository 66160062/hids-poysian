import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { Assignment } from './entities/assignment.entity';
import { InspectionJob } from 'src/inspection-jobs/entities/inspection-job.entity';
import { User } from 'src/users/entities/user.entity';

describe('AssignmentsService', () => {
  let service: AssignmentsService;
  let assignmentsRepo: {
    findOne: jest.Mock;
    find: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    softDelete: jest.Mock;
  };
  let jobsRepo: { findOne: jest.Mock };
  let usersRepo: { findOne: jest.Mock };

  beforeEach(async () => {
    assignmentsRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    };
    jobsRepo = { findOne: jest.fn() };
    usersRepo = { findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssignmentsService,
        { provide: getRepositoryToken(Assignment), useValue: assignmentsRepo },
        { provide: getRepositoryToken(InspectionJob), useValue: jobsRepo },
        { provide: getRepositoryToken(User), useValue: usersRepo },
      ],
    }).compile();

    service = module.get<AssignmentsService>(AssignmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('assign', () => {
    it('throws NotFoundException when the job does not exist', async () => {
      jobsRepo.findOne.mockResolvedValue(null);

      await expect(
        service.assign({ jobId: 1, inspectorId: 2 } as never),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws NotFoundException when the inspector does not exist', async () => {
      jobsRepo.findOne.mockResolvedValue({ jobId: 1 });
      usersRepo.findOne.mockResolvedValue(null);

      await expect(
        service.assign({ jobId: 1, inspectorId: 2 } as never),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws BadRequestException when the inspector is already assigned to the job', async () => {
      jobsRepo.findOne.mockResolvedValue({ jobId: 1 });
      usersRepo.findOne.mockResolvedValue({ id: 2 });
      assignmentsRepo.findOne.mockResolvedValue({ id: 5 });

      await expect(
        service.assign({ jobId: 1, inspectorId: 2 } as never),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('creates the assignment once job, inspector, and no duplicate are confirmed', async () => {
      jobsRepo.findOne.mockResolvedValue({ jobId: 1 });
      usersRepo.findOne.mockResolvedValue({ id: 2 });
      assignmentsRepo.findOne.mockResolvedValue(null);
      assignmentsRepo.create.mockImplementation((value) => value);
      assignmentsRepo.save.mockImplementation((value) => value);

      const result = await service.assign({
        jobId: 1,
        inspectorId: 2,
      } as never);

      expect(result).toMatchObject({ job: { jobId: 1 }, inspector: { id: 2 } });
    });
  });

  describe('findByJob', () => {
    it('throws NotFoundException when the job does not exist', async () => {
      jobsRepo.findOne.mockResolvedValue(null);

      await expect(service.findByJob(1)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('maps assignment rows to inspector chips', async () => {
      jobsRepo.findOne.mockResolvedValue({ jobId: 1 });
      assignmentsRepo.find.mockResolvedValue([
        {
          id: 3,
          inspector: {
            id: 7,
            fullName: 'สมชาย',
            role: 'inspector',
            phoneNumber: '0899999999',
            imageUrl: '/avatars/7.jpg',
          },
        },
      ]);

      await expect(service.findByJob(1)).resolves.toEqual([
        {
          assignmentId: 3,
          id: 7,
          fullName: 'สมชาย',
          info: 'inspector · 0899999999',
          imageUrl: '/avatars/7.jpg',
        },
      ]);
    });
  });

  describe('remove', () => {
    it('throws NotFoundException when the assignment does not exist', async () => {
      assignmentsRepo.findOne.mockResolvedValue(null);

      await expect(service.remove(1)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('rejects removal when the job status blocks unassignment', async () => {
      assignmentsRepo.findOne.mockResolvedValue({
        id: 1,
        job: { status: 'Locked' },
      });

      await expect(service.remove(1)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('soft-deletes the assignment when the job status allows it', async () => {
      assignmentsRepo.findOne.mockResolvedValue({
        id: 1,
        job: { status: 'Active' },
      });

      await expect(service.remove(1)).resolves.toEqual({
        deleted: true,
        id: 1,
      });
      expect(assignmentsRepo.softDelete).toHaveBeenCalledWith(1);
    });
  });
});
