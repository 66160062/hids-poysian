import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { InspectionJob } from 'src/inspection-jobs/entities/inspection-job.entity';
import { InspectionRound } from 'src/inspection-rounds/entities/inspection-round.entity';
import { Customer } from 'src/customers/entities/customer.entity';
import { Address } from 'src/addresses/entities/address.entity';
import { HouseType } from 'src/house-types/entities/house-type.entity';
import { User } from 'src/users/entities/user.entity';
import { InspectionTeamMember } from 'src/inspection-team-members/entities/inspection-team-member.entity';
import { CreateDailyReportDto } from './dto/create-daily-report.dto';
import { CreateDailyReportRoundDto } from './dto/create-daily-report-round.dto';
import { InspectionSummaryItem } from 'src/inspection-summary-items/entities/inspection-summary-item.entity';
import { Team } from 'src/teams/entities/team.entity';
import { Defect, DefectStatus } from 'src/defects/entities/defect.entity';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationType } from 'src/notifications/entities/notification.entity';
import { MailService } from 'src/mail/mail.service';

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
    private readonly notificationsService: NotificationsService,
    private readonly mailService: MailService,
  ) {}

  private buildInspectorPortalUrl(): string {
    const baseUrl = (
      process.env.FRONTEND_URL ?? 'http://localhost:9000'
    ).replace(/\/$/, '');
    return `${baseUrl}/#/inspector/Inspectsdashboard`;
  }

  // แจ้งเตือนผู้ตรวจที่ admin เพิ่งเลือกเข้ารอบนี้โดยตรง (เลือกทีมหรือเลือกรายบุคคลตอนสร้าง/เปิดรอบ)
  // ไม่แจ้งกรณีที่รอบใหม่แค่สืบทอดผู้ตรวจจากรอบก่อนหน้าอัตโนมัติ (ไม่ใช่การเลือกใหม่ของ admin)
  private async notifyAssignedInspectors(
    inspectorIds: number[],
    jobId: number,
    round: InspectionRound,
    projectName: string,
  ) {
    if (inspectorIds.length === 0) return;

    for (const inspectorId of inspectorIds) {
      void this.notificationsService.create({
        type: NotificationType.INFO,
        recipientUserId: inspectorId,
        message: `คุณได้รับมอบหมายรอบตรวจใหม่: ${projectName}`,
        jobId,
        roundId: round.roundId,
      });
    }

    const inspectors = await this.usersRepo.findBy({ id: In(inspectorIds) });
    const portalUrl = this.buildInspectorPortalUrl();
    const scheduledDate = round.scheduledDate
      ? new Date(round.scheduledDate).toLocaleDateString('th-TH', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : null;

    for (const inspector of inspectors) {
      if (!inspector.email) continue;
      void this.mailService.sendRoundOpenedEmail({
        to: inspector.email,
        inspectorName: inspector.fullName,
        jobTitle: projectName,
        roundNumber: round.roundNumber,
        scheduledDate,
        portalUrl,
      });
    }
  }

  async create(createDailyReportDto: CreateDailyReportDto) {
    if (!createDailyReportDto.inspectorId && !createDailyReportDto.teamId) {
      throw new BadRequestException(
        'ต้องระบุผู้ตรวจหรือทีมอย่างน้อยหนึ่งอย่าง',
      );
    }

    const [customer, address, houseType, inspector, teamEntity] =
      await Promise.all([
        this.customersRepo.findOneBy({
          customerId: createDailyReportDto.customerId,
        }),
        this.addressesRepo.findOneBy({
          addressId: createDailyReportDto.addressId,
        }),
        this.houseTypesRepo.findOneBy({
          house_type_id: createDailyReportDto.houseTypeId,
        }),
        createDailyReportDto.inspectorId
          ? this.usersRepo.findOneBy({ id: createDailyReportDto.inspectorId })
          : Promise.resolve(null),
        createDailyReportDto.teamId
          ? this.dataSource
              .getRepository(Team)
              .findOneBy({ team_Id: createDailyReportDto.teamId })
          : Promise.resolve(null),
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
    if (createDailyReportDto.inspectorId && !inspector) {
      throw new NotFoundException(
        `ไม่พบผู้ตรวจ ID ${createDailyReportDto.inspectorId}`,
      );
    }
    if (createDailyReportDto.teamId && !teamEntity) {
      throw new NotFoundException(`ไม่พบทีม ID ${createDailyReportDto.teamId}`);
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

      const round = manager.getRepository(InspectionRound).create({
        job: savedJob,
        roundNumber: 1,
        scheduledDate: createDailyReportDto.scheduledDate,
        status: createDailyReportDto.roundStatus ?? 'SCHEDULED',
      });
      const savedRound = await manager
        .getRepository(InspectionRound)
        .save(round);

      const teamMember = manager.getRepository(InspectionTeamMember).create({
        round: savedRound,
        inspector,
        team: teamEntity,
      });
      const savedTeamMember = await manager
        .getRepository(InspectionTeamMember)
        .save(teamMember);

      return {
        job: savedJob,
        teamMember: savedTeamMember,
        round: savedRound,
      };
    });
  }

  async findRoundsByJob(jobId: number) {
    const job = await this.dataSource.getRepository(InspectionJob).findOneBy({
      jobId,
    });
    if (!job) {
      throw new NotFoundException(`ไม่พบ daily report ID ${jobId}`);
    }

    return this.dataSource.getRepository(InspectionRound).find({
      where: { job: { jobId } },
      relations: ['teamMembers', 'teamMembers.inspector', 'teamMembers.team'],
      order: { roundNumber: 'ASC' },
    });
  }

  async createRound(jobId: number, createRoundDto: CreateDailyReportRoundDto) {
    const job = await this.dataSource.getRepository(InspectionJob).findOneBy({
      jobId,
    });
    if (!job) {
      throw new NotFoundException(`ไม่พบ daily report ID ${jobId}`);
    }

    let notifyInspectorIds: number[] = [];

    const savedRound = await this.dataSource.transaction(async (manager) => {
      const latestRound = await manager.getRepository(InspectionRound).findOne({
        where: { job: { jobId } },
        order: { roundNumber: 'DESC' },
      });

      if (
        latestRound &&
        latestRound.status !== 'APPROVED' &&
        latestRound.status !== 'CANCELLED'
      ) {
        throw new BadRequestException(
          'ไม่สามารถสร้างรอบใหม่ได้ เนื่องจากรอบก่อนหน้ายังไม่เสร็จสิ้น',
        );
      }

      const round = manager.getRepository(InspectionRound).create({
        job,
        roundNumber: (latestRound?.roundNumber ?? 0) + 1,
        scheduledDate: createRoundDto.scheduledDate,
        status: createRoundDto.status ?? 'SCHEDULED',
      });
      const savedRound = await manager
        .getRepository(InspectionRound)
        .save(round);

      const resolved = await this.resolveTeamMember(
        manager,
        job,
        savedRound,
        createRoundDto,
      );
      notifyInspectorIds = resolved.notifyInspectorIds;

      // --- CLONE SUMMARY ITEMS & DEFECTS FROM LATEST ROUND ---
      if (latestRound) {
        // 1. Clone InspectionSummaryItem from previous round
        const latestSummaryItems = await manager
          .getRepository(InspectionSummaryItem)
          .find({
            where: { round: { roundId: latestRound.roundId } },
            relations: ['template', 'option', 'refItem'],
          });

        if (latestSummaryItems.length > 0) {
          // Copy summaryCompletedAt so UI recognises summary as already done
          savedRound.summaryCompletedAt = latestRound.summaryCompletedAt;
          await manager.getRepository(InspectionRound).save(savedRound);

          const clonedItems = latestSummaryItems.map((item) =>
            manager.getRepository(InspectionSummaryItem).create({
              round: savedRound,
              template: item.template,
              option: item.option,
              refItem: item.refItem ?? null,
              detailValue: item.detailValue,
            }),
          );
          await manager.getRepository(InspectionSummaryItem).save(clonedItems);
        }

        // 2. Clone non-verified defects from previous round
        const oldDefects = await manager.getRepository(Defect).find({
          where: { round: { roundId: latestRound.roundId } },
          relations: ['room', 'subRoom', 'floor', 'subCategories', 'inspector'],
        });

        const defectsToClone = oldDefects.filter(
          (d) => d.status !== DefectStatus.VERIFIED,
        );

        if (defectsToClone.length > 0) {
          const clonedDefects = defectsToClone.map((d) =>
            manager.getRepository(Defect).create({
              description: d.description,
              severity: d.severity,
              imageUrl: d.imageUrl,
              imageFileSize: d.imageFileSize,
              contractorImageUrl: d.contractorImageUrl,
              contractorImageFileSize: d.contractorImageFileSize,
              contractorNote: d.contractorNote,
              status: d.status,
              round: savedRound,
              room: d.room,
              subRoom: d.subRoom,
              floor: d.floor,
              subCategories: d.subCategories,
              inspector: d.inspector,
            }),
          );
          await manager
            .getRepository(Defect)
            .save(clonedDefects, { chunk: 100 });
        }
      }

      // Update job status to Active when a round is created
      job.status = 'Active';
      await manager.getRepository(InspectionJob).save(job);

      return savedRound;
    });

    void this.notifyAssignedInspectors(
      notifyInspectorIds,
      job.jobId,
      savedRound,
      job.projectName,
    );

    return savedRound;
  }

  async cloneLatestRound(jobId: number) {
    const job = await this.dataSource.getRepository(InspectionJob).findOneBy({
      jobId,
    });
    if (!job) {
      throw new NotFoundException(`ไม่พบ daily report ID ${jobId}`);
    }

    return this.dataSource.transaction(async (manager) => {
      const latestRound = await this.findLatestRound(manager, jobId);
      if (!latestRound) {
        const firstRound = manager.getRepository(InspectionRound).create({
          job,
          roundNumber: 1,
          status: 'SCHEDULED',
        });
        const savedFirstRound = await manager
          .getRepository(InspectionRound)
          .save(firstRound);

        await this.resolveTeamMember(manager, job, savedFirstRound, {});
        // {} = ไม่มี inspectorId/teamId ระบุมา จึงเป็นแค่ fallback ไม่ใช่การเลือกใหม่ของ admin — ไม่ต้องแจ้งเตือน

        job.status = 'Active';
        await manager.getRepository(InspectionJob).save(job);

        return {
          round: savedFirstRound,
          items: [],
        };
      }

      const clonedRound = manager.getRepository(InspectionRound).create({
        job,
        roundNumber: latestRound.roundNumber + 1,
        scheduledDate: latestRound.scheduledDate,
        status: 'SCHEDULED',
      });
      const savedClonedRound = await manager
        .getRepository(InspectionRound)
        .save(clonedRound);

      // Clone ALL team members from the previous round
      const previousTeamMembers = await manager
        .getRepository(InspectionTeamMember)
        .find({
          where: { round: { roundId: latestRound.roundId } },
          relations: ['inspector', 'team'],
        });

      await Promise.all(
        previousTeamMembers.map((member) =>
          manager.getRepository(InspectionTeamMember).save(
            manager.getRepository(InspectionTeamMember).create({
              round: savedClonedRound,
              inspector: member.inspector,
              team: member.team,
            }),
          ),
        ),
      );

      const latestItems = await manager
        .getRepository(InspectionSummaryItem)
        .find({
          where: { round: { roundId: latestRound.roundId } },
          relations: ['template', 'option'],
        });

      const clonedItems = await manager
        .getRepository(InspectionSummaryItem)
        .save(
          latestItems.map((item) =>
            manager.getRepository(InspectionSummaryItem).create({
              round: clonedRound,
              template: item.template,
              option: item.option,
              refItem: { itemId: item.itemId } as InspectionSummaryItem,
              detailValue: item.detailValue,
            }),
          ),
        );

      job.status = 'Active';
      await manager.getRepository(InspectionJob).save(job);

      return {
        round: clonedRound,
        items: clonedItems,
      };
    });
  }

  private findLatestRound(manager: EntityManager, jobId: number) {
    return manager.getRepository(InspectionRound).findOne({
      where: { job: { jobId } },
      relations: ['teamMembers', 'teamMembers.inspector', 'teamMembers.team'],
      order: { roundNumber: 'DESC' },
    });
  }

  private async resolveTeamMember(
    manager: EntityManager,
    job: InspectionJob,
    round: InspectionRound,
    createRoundDto: Pick<
      CreateDailyReportRoundDto,
      'teamMemberId' | 'inspectorId' | 'teamId'
    >,
  ): Promise<{
    teamMember: InspectionTeamMember;
    notifyInspectorIds: number[];
  }> {
    if (createRoundDto.inspectorId || createRoundDto.teamId) {
      let inspector: User | null = null;
      let teamEntity: Team | null = null;
      let notifyInspectorIds: number[] = [];

      if (createRoundDto.inspectorId) {
        inspector = await manager.getRepository(User).findOneBy({
          id: createRoundDto.inspectorId,
        });
        if (!inspector) {
          throw new NotFoundException(
            `ไม่พบผู้ตรวจ ID ${createRoundDto.inspectorId}`,
          );
        }
        notifyInspectorIds = [inspector.id];
      }

      if (createRoundDto.teamId) {
        teamEntity = await manager.getRepository(Team).findOneBy({
          team_Id: createRoundDto.teamId,
        });
        if (!teamEntity) {
          throw new NotFoundException(`ไม่พบทีม ID ${createRoundDto.teamId}`);
        }
        // ทีมนี้ไม่ผูก inspector คนเดียวใน InspectionTeamMember (team: entity, inspector: null)
        // ต้องแยกไปหาสมาชิกทุกคนในทีมเพื่อแจ้งเตือนแต่ละคน
        const teamInspectors = await manager.getRepository(User).find({
          where: { teamId: teamEntity.team_Id, role: 'inspector' },
        });
        notifyInspectorIds = teamInspectors.map((u) => u.id);
      }

      const teamMember = await manager.getRepository(InspectionTeamMember).save(
        manager.getRepository(InspectionTeamMember).create({
          round,
          inspector,
          team: teamEntity,
        }),
      );

      return { teamMember, notifyInspectorIds };
    }

    const latestRoundWithTeam = await manager
      .getRepository(InspectionRound)
      .findOne({
        where: { job: { jobId: job.jobId } },
        relations: ['teamMembers', 'teamMembers.inspector', 'teamMembers.team'],
        order: { roundNumber: 'DESC' },
      });

    if (
      !latestRoundWithTeam ||
      !latestRoundWithTeam.teamMembers ||
      latestRoundWithTeam.teamMembers.length === 0
    ) {
      throw new NotFoundException(
        'ไม่พบข้อมูลผู้ตรวจจากรอบก่อนหน้า กรุณาระบุผู้ตรวจหรือทีมสำหรับรอบนี้',
      );
    }

    const primaryMember = latestRoundWithTeam.teamMembers[0];

    // สืบทอดผู้ตรวจจากรอบก่อนหน้าอัตโนมัติ ไม่ใช่การเลือกใหม่ของ admin เลยไม่ต้องแจ้งเตือน
    const teamMember = await manager.getRepository(InspectionTeamMember).save(
      manager.getRepository(InspectionTeamMember).create({
        round,
        inspector: primaryMember.inspector,
        team: primaryMember.team,
      }),
    );

    return { teamMember, notifyInspectorIds: [] };
  }
}
