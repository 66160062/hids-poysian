import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DailyReportsService } from './daily-reports.service';
import { Customer } from 'src/customers/entities/customer.entity';
import { Address } from 'src/addresses/entities/address.entity';
import { HouseType } from 'src/house-types/entities/house-type.entity';
import { User } from 'src/users/entities/user.entity';
import { InspectionJob } from 'src/inspection-jobs/entities/inspection-job.entity';
import { InspectionRound } from 'src/inspection-rounds/entities/inspection-round.entity';
import { Team } from 'src/teams/entities/team.entity';
import { NotificationsService } from 'src/notifications/notifications.service';
import { MailService } from 'src/mail/mail.service';

function createManagerMock() {
  const repoMocks: Record<string, Record<string, jest.Mock>> = {};
  const getRepoMock = (entityClass: { name: string }) => {
    const name = entityClass.name;
    if (!repoMocks[name]) {
      repoMocks[name] = {
        create: jest.fn((value: Record<string, unknown>) => value),
        save: jest.fn((value: unknown) => value),
        find: jest.fn().mockResolvedValue([]),
        findOne: jest.fn(),
        findOneBy: jest.fn(),
      };
    }
    return repoMocks[name];
  };

  return {
    getRepository: jest.fn(getRepoMock),
    repos: repoMocks,
  };
}

describe('DailyReportsService', () => {
  let service: DailyReportsService;
  let customersRepo: { findOneBy: jest.Mock };
  let addressesRepo: { findOneBy: jest.Mock };
  let houseTypesRepo: { findOneBy: jest.Mock };
  let usersRepo: { findOneBy: jest.Mock; findBy: jest.Mock };
  let dataSource: {
    transaction: jest.Mock;
    getRepository: jest.Mock;
  };
  let notificationsService: { create: jest.Mock };
  let mailService: { sendRoundOpenedEmail: jest.Mock };

  beforeEach(async () => {
    customersRepo = { findOneBy: jest.fn() };
    addressesRepo = { findOneBy: jest.fn() };
    houseTypesRepo = { findOneBy: jest.fn() };
    usersRepo = { findOneBy: jest.fn(), findBy: jest.fn().mockResolvedValue([]) };
    dataSource = {
      transaction: jest.fn(),
      getRepository: jest.fn(),
    };
    notificationsService = { create: jest.fn().mockResolvedValue(null) };
    mailService = { sendRoundOpenedEmail: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DailyReportsService,
        { provide: DataSource, useValue: dataSource },
        { provide: getRepositoryToken(Customer), useValue: customersRepo },
        { provide: getRepositoryToken(Address), useValue: addressesRepo },
        { provide: getRepositoryToken(HouseType), useValue: houseTypesRepo },
        { provide: getRepositoryToken(User), useValue: usersRepo },
        { provide: NotificationsService, useValue: notificationsService },
        { provide: MailService, useValue: mailService },
      ],
    }).compile();

    service = module.get<DailyReportsService>(DailyReportsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('rejects when neither an inspector nor a team is given', async () => {
      await expect(
        service.create({
          customerId: 1,
          addressId: 1,
          houseTypeId: 1,
        } as never),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws NotFoundException when the customer does not exist', async () => {
      customersRepo.findOneBy.mockResolvedValue(null);
      addressesRepo.findOneBy.mockResolvedValue({ addressId: 1 });
      houseTypesRepo.findOneBy.mockResolvedValue({ house_type_id: 1 });
      usersRepo.findOneBy.mockResolvedValue({ id: 5 });

      await expect(
        service.create({
          customerId: 99,
          addressId: 1,
          houseTypeId: 1,
          inspectorId: 5,
        } as never),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('creates a job, its first round, and the team member inside one transaction', async () => {
      customersRepo.findOneBy.mockResolvedValue({ customerId: 1 });
      addressesRepo.findOneBy.mockResolvedValue({ addressId: 1 });
      houseTypesRepo.findOneBy.mockResolvedValue({ house_type_id: 1 });
      usersRepo.findOneBy.mockResolvedValue({ id: 5 });

      const manager = createManagerMock();
      dataSource.transaction.mockImplementation((cb: never) =>
        (cb as (m: unknown) => unknown)(manager),
      );

      const result = await service.create({
        customerId: 1,
        addressId: 1,
        houseTypeId: 1,
        inspectorId: 5,
      } as never);

      expect(dataSource.transaction).toHaveBeenCalledTimes(1);
      expect(result).toHaveProperty('job');
      expect(result).toHaveProperty('round');
      expect(result).toHaveProperty('teamMember');
    });
  });

  describe('createRound', () => {
    it('throws NotFoundException when the job does not exist', async () => {
      dataSource.getRepository.mockReturnValue({
        findOneBy: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.createRound(99, { scheduledDate: undefined } as never),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects creating a new round while the previous one is still open', async () => {
      dataSource.getRepository.mockReturnValue({
        findOneBy: jest.fn().mockResolvedValue({ jobId: 1 }),
      });
      const manager = createManagerMock();
      manager.repos['InspectionRound'] = {
        ...manager.repos['InspectionRound'],
        findOne: jest
          .fn()
          .mockResolvedValue({ status: 'SUBMITTED', roundNumber: 1 }),
      };
      dataSource.transaction.mockImplementation((cb: never) =>
        (cb as (m: unknown) => unknown)(manager),
      );

      await expect(service.createRound(1, {} as never)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('notifies every inspector in the selected team with the new round id', async () => {
      dataSource.getRepository.mockReturnValue({
        findOneBy: jest
          .fn()
          .mockResolvedValue({ jobId: 1, projectName: 'บ้านทดสอบ' }),
      });

      const manager = createManagerMock();
      const roundRepo = manager.getRepository(InspectionRound);
      roundRepo.findOne = jest.fn().mockResolvedValue(null);
      roundRepo.save = jest.fn((value: Record<string, unknown>) => ({
        ...value,
        roundId: 42,
      }));
      manager.getRepository(Team).findOneBy = jest
        .fn()
        .mockResolvedValue({ team_Id: 7 });
      manager.getRepository(User).find = jest
        .fn()
        .mockResolvedValue([{ id: 10 }, { id: 11 }]);
      usersRepo.findBy.mockResolvedValue([
        { id: 10, email: 'a@example.com', fullName: 'ผู้ตรวจเอ' },
        { id: 11, email: '', fullName: 'ผู้ตรวจบี' },
      ]);
      dataSource.transaction.mockImplementation((cb: never) =>
        (cb as (m: unknown) => unknown)(manager),
      );

      await service.createRound(1, { teamId: 7 } as never);
      await new Promise((resolve) => setImmediate(resolve));

      expect(notificationsService.create).toHaveBeenCalledTimes(2);
      expect(notificationsService.create).toHaveBeenCalledWith(
        expect.objectContaining({ recipientUserId: 10, roundId: 42, jobId: 1 }),
      );
      expect(notificationsService.create).toHaveBeenCalledWith(
        expect.objectContaining({ recipientUserId: 11, roundId: 42, jobId: 1 }),
      );

      expect(mailService.sendRoundOpenedEmail).toHaveBeenCalledTimes(1);
      expect(mailService.sendRoundOpenedEmail).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'a@example.com', jobTitle: 'บ้านทดสอบ' }),
      );
    });

    it('does not notify anyone when the round just inherits its team from the previous round', async () => {
      dataSource.getRepository.mockReturnValue({
        findOneBy: jest
          .fn()
          .mockResolvedValue({ jobId: 1, projectName: 'บ้านทดสอบ' }),
      });

      const manager = createManagerMock();
      const roundRepo = manager.getRepository(InspectionRound);
      roundRepo.findOne = jest.fn().mockResolvedValue({
        status: 'APPROVED',
        roundNumber: 1,
        teamMembers: [{ inspector: { id: 99 }, team: null }],
      });
      roundRepo.save = jest.fn((value: Record<string, unknown>) => ({
        ...value,
        roundId: 55,
      }));
      dataSource.transaction.mockImplementation((cb: never) =>
        (cb as (m: unknown) => unknown)(manager),
      );

      await service.createRound(1, {} as never);

      expect(notificationsService.create).not.toHaveBeenCalled();
    });
  });
});
