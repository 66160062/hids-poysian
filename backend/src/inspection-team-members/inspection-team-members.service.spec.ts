import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InspectionTeamMembersService } from './inspection-team-members.service';
import { InspectionTeamMember } from './entities/inspection-team-member.entity';
import { InspectionJob } from 'src/inspection-jobs/entities/inspection-job.entity';
import { InspectionRound } from 'src/inspection-rounds/entities/inspection-round.entity';
import { User } from 'src/users/entities/user.entity';
import { Team } from 'src/teams/entities/team.entity';

describe('InspectionTeamMembersService', () => {
  let service: InspectionTeamMembersService;
  let teamsRepo: {
    findOne: jest.Mock;
    find: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    softDelete: jest.Mock;
  };
  let jobsRepo: { findOne: jest.Mock };
  let roundsRepo: { findOne: jest.Mock };
  let usersRepo: { findOne: jest.Mock };
  let teamRepo: { findOne: jest.Mock };

  beforeEach(async () => {
    teamsRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    };
    jobsRepo = { findOne: jest.fn() };
    roundsRepo = { findOne: jest.fn() };
    usersRepo = { findOne: jest.fn() };
    teamRepo = { findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InspectionTeamMembersService,
        { provide: getRepositoryToken(InspectionTeamMember), useValue: teamsRepo },
        { provide: getRepositoryToken(InspectionJob), useValue: jobsRepo },
        { provide: getRepositoryToken(InspectionRound), useValue: roundsRepo },
        { provide: getRepositoryToken(User), useValue: usersRepo },
        { provide: getRepositoryToken(Team), useValue: teamRepo },
      ],
    }).compile();

    service = module.get<InspectionTeamMembersService>(
      InspectionTeamMembersService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('throws NotFoundException when the job does not exist', async () => {
      jobsRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create({ jobId: 1, inspectorId: 2 } as never),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws NotFoundException when the job has no round yet', async () => {
      jobsRepo.findOne.mockResolvedValue({ jobId: 1 });
      roundsRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create({ jobId: 1, inspectorId: 2 } as never),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws BadRequestException when neither inspector nor team is given', async () => {
      jobsRepo.findOne.mockResolvedValue({ jobId: 1 });
      roundsRepo.findOne.mockResolvedValue({ roundId: 10 });

      await expect(service.create({ jobId: 1 } as never)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('throws NotFoundException when the given inspector does not exist', async () => {
      jobsRepo.findOne.mockResolvedValue({ jobId: 1 });
      roundsRepo.findOne.mockResolvedValue({ roundId: 10 });
      usersRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create({ jobId: 1, inspectorId: 99 } as never),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws BadRequestException when the same inspector is already assigned to the round', async () => {
      jobsRepo.findOne.mockResolvedValue({ jobId: 1 });
      roundsRepo.findOne.mockResolvedValue({ roundId: 10 });
      usersRepo.findOne.mockResolvedValue({ id: 2 });
      teamsRepo.findOne.mockResolvedValue({ id: 5 });

      await expect(
        service.create({ jobId: 1, inspectorId: 2 } as never),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('assigns an inspector to the latest round when everything checks out', async () => {
      jobsRepo.findOne.mockResolvedValue({ jobId: 1 });
      roundsRepo.findOne.mockResolvedValue({ roundId: 10 });
      usersRepo.findOne.mockResolvedValue({ id: 2 });
      teamsRepo.findOne.mockResolvedValue(null);
      teamsRepo.create.mockImplementation((value) => value);
      teamsRepo.save.mockImplementation((value) => value);

      const result = await service.create({
        jobId: 1,
        inspectorId: 2,
      } as never);

      expect(result).toMatchObject({
        round: { roundId: 10 },
        inspector: { id: 2 },
      });
    });
  });

  describe('findByJob', () => {
    it('returns an empty list when the job has no round yet', async () => {
      jobsRepo.findOne.mockResolvedValue({ jobId: 1 });
      roundsRepo.findOne.mockResolvedValue(null);

      await expect(service.findByJob(1)).resolves.toEqual([]);
    });

    it('maps a team-only assignment to an inspector chip using team fields', async () => {
      jobsRepo.findOne.mockResolvedValue({ jobId: 1 });
      roundsRepo.findOne.mockResolvedValue({ roundId: 10 });
      teamsRepo.find.mockResolvedValue([
        {
          id: 1,
          inspector: null,
          team: {
            team_Id: 4,
            team_name: 'ทีม A',
            contact_info: '081-234-5678',
            logo_url: null,
          },
        },
      ]);

      await expect(service.findByJob(1)).resolves.toEqual([
        {
          assignmentId: 1,
          id: 4,
          fullName: 'ทีม A',
          info: 'ทีมงาน · 081-234-5678',
          imageUrl: '/project-images/unknown.jpg',
        },
      ]);
    });

    it('maps an inspector assignment to a chip using inspector fields', async () => {
      jobsRepo.findOne.mockResolvedValue({ jobId: 1 });
      roundsRepo.findOne.mockResolvedValue({ roundId: 10 });
      teamsRepo.find.mockResolvedValue([
        {
          id: 2,
          inspector: {
            id: 7,
            fullName: 'สมชาย',
            role: 'inspector',
            phoneNumber: '0899999999',
            imageUrl: '/avatars/7.jpg',
          },
          team: null,
        },
      ]);

      await expect(service.findByJob(1)).resolves.toEqual([
        {
          assignmentId: 2,
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
      teamsRepo.findOne.mockResolvedValue(null);

      await expect(service.remove(1)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('rejects removal when the round status blocks unassignment', async () => {
      teamsRepo.findOne.mockResolvedValue({
        id: 1,
        round: { status: 'Locked' },
      });

      await expect(service.remove(1)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('soft-deletes the assignment when the round status allows it', async () => {
      teamsRepo.findOne.mockResolvedValue({
        id: 1,
        round: { status: 'Active' },
      });

      await expect(service.remove(1)).resolves.toEqual({
        deleted: true,
        id: 1,
      });
      expect(teamsRepo.softDelete).toHaveBeenCalledWith(1);
    });
  });
});
