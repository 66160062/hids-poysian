import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Address } from 'src/addresses/entities/address.entity';
import { Customer } from 'src/customers/entities/customer.entity';
import { HouseType } from 'src/house-types/entities/house-type.entity';
import { InspectionJob } from 'src/inspection-jobs/entities/inspection-job.entity';
import { InspectionRound } from 'src/inspection-rounds/entities/inspection-round.entity';
import { InspectionTeamMember } from 'src/inspection-team-members/entities/inspection-team-member.entity';
import { User } from 'src/users/entities/user.entity';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { CreateDailyReportDto } from './dto/create-daily-report.dto';
import { CreateDailyReportRoundDto } from './dto/create-daily-report-round.dto';

@Injectable()
export class DailyReportsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Customer)
    private readonly customersRepo: Repository<Customer>,
    @InjectRepository(Address)
    private readonly addressesRepo: Repository<Address>,
    @InjectRepository(HouseType)
    private readonly houseTypesRepo: Repository<HouseType>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async create(createDailyReportDto: CreateDailyReportDto) {
    const [customer, address, houseType, inspector] = await Promise.all([
      this.customersRepo.findOneBy({
        customerId: createDailyReportDto.customerId,
      }),
      this.addressesRepo.findOneBy({ addressId: createDailyReportDto.addressId }),
      this.houseTypesRepo.findOneBy({
        house_type_id: createDailyReportDto.houseTypeId,
      }),
      this.usersRepo.findOneBy({ id: createDailyReportDto.inspectorId }),
    ]);

    if (!customer) {
      throw new NotFoundException(
        `ไม่พบลูกค้า ID ${createDailyReportDto.customerId}`,
      );
    }
    if (!address) {
      throw new NotFoundException(
        `ไม่พบที่อยู่ ID ${createDailyReportDto.addressId}`,
      );
    }
    if (!houseType) {
      throw new NotFoundException(
        `ไม่พบประเภทบ้าน ID ${createDailyReportDto.houseTypeId}`,
      );
    }
    if (!inspector) {
      throw new NotFoundException(
        `ไม่พบผู้ตรวจ ID ${createDailyReportDto.inspectorId}`,
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const job = manager.getRepository(InspectionJob).create({
        inspectionType: createDailyReportDto.inspectionType,
        projectName: createDailyReportDto.projectName,
        locationCoordinate: createDailyReportDto.locationCoordinate,
        housePlanUrl: createDailyReportDto.housePlanUrl,
        usableArea: createDailyReportDto.usableArea,
        projectImageUrl:
          createDailyReportDto.projectImageUrl ??
          '/uploads/inspection_jobs/unknown.jpg',
        status: createDailyReportDto.status ?? 'Active',
        customer,
        address,
        houseType,
      });
      const savedJob = await manager.getRepository(InspectionJob).save(job);

      const teamMember = manager.getRepository(InspectionTeamMember).create({
        job: savedJob,
        inspector,
      });
      const savedTeamMember = await manager
        .getRepository(InspectionTeamMember)
        .save(teamMember);

      const round = manager.getRepository(InspectionRound).create({
        job: savedJob,
        teamMember: savedTeamMember,
        roundNumber: 1,
        scheduledDate: createDailyReportDto.scheduledDate,
        status: createDailyReportDto.roundStatus ?? 'SCHEDULED',
      });
      const savedRound = await manager.getRepository(InspectionRound).save(round);

      return {
        job: savedJob,
        teamMember: savedTeamMember,
        round: savedRound,
      };
    });
  }

  async createRound(jobId: number, createRoundDto: CreateDailyReportRoundDto) {
    const job = await this.dataSource.getRepository(InspectionJob).findOneBy({
      jobId,
    });
    if (!job) {
      throw new NotFoundException(`ไม่พบ daily report ID ${jobId}`);
    }

    return this.dataSource.transaction(async (manager) => {
      const teamMember = await this.resolveTeamMember(
        manager,
        job,
        createRoundDto,
      );
      const latestRound = await manager
        .getRepository(InspectionRound)
        .createQueryBuilder('round')
        .select('MAX(round.roundNumber)', 'maxRoundNumber')
        .where('round.job_id = :jobId', { jobId })
        .getRawOne<{ maxRoundNumber: string | null }>();

      const round = manager.getRepository(InspectionRound).create({
        job,
        teamMember,
        roundNumber: Number(latestRound?.maxRoundNumber ?? 0) + 1,
        scheduledDate: createRoundDto.scheduledDate,
        status: createRoundDto.status ?? 'SCHEDULED',
      });

      return manager.getRepository(InspectionRound).save(round);
    });
  }

  private async resolveTeamMember(
    manager: EntityManager,
    job: InspectionJob,
    createRoundDto: CreateDailyReportRoundDto,
  ) {
    if (createRoundDto.teamMemberId) {
      const teamMember = await manager
        .getRepository(InspectionTeamMember)
        .findOne({
          where: {
            id: createRoundDto.teamMemberId,
            job: { jobId: job.jobId },
          },
          relations: ['job', 'inspector'],
        });

      if (!teamMember) {
        throw new NotFoundException(
          `ไม่พบสมาชิกทีม ID ${createRoundDto.teamMemberId} ใน daily report ID ${job.jobId}`,
        );
      }

      return teamMember;
    }

    if (createRoundDto.inspectorId) {
      const inspector = await manager.getRepository(User).findOneBy({
        id: createRoundDto.inspectorId,
      });
      if (!inspector) {
        throw new NotFoundException(
          `ไม่พบผู้ตรวจ ID ${createRoundDto.inspectorId}`,
        );
      }

      const existingTeamMember = await manager
        .getRepository(InspectionTeamMember)
        .findOne({
          where: {
            job: { jobId: job.jobId },
            inspector: { id: createRoundDto.inspectorId },
          },
          relations: ['job', 'inspector'],
        });

      if (existingTeamMember) return existingTeamMember;

      return manager.getRepository(InspectionTeamMember).save(
        manager.getRepository(InspectionTeamMember).create({
          job,
          inspector,
        }),
      );
    }

    const latestTeamMember = await manager
      .getRepository(InspectionTeamMember)
      .findOne({
        where: { job: { jobId: job.jobId } },
        relations: ['job', 'inspector'],
        order: { id: 'DESC' },
      });

    if (!latestTeamMember) {
      throw new NotFoundException(
        `ไม่พบสมาชิกทีมสำหรับ daily report ID ${job.jobId}`,
      );
    }

    return latestTeamMember;
  }
}
