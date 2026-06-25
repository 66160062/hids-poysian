import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateInspectionRoundDto } from './dto/create-inspection-round.dto';
import { UpdateInspectionRoundDto } from './dto/update-inspection-round.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { InspectionRound } from './entities/inspection-round.entity';
import { Repository, DataSource } from 'typeorm';
import { InspectionTeamMember } from 'src/inspection-team-members/entities/inspection-team-member.entity';
import { InspectionJob } from 'src/inspection-jobs/entities/inspection-job.entity';
import { User } from 'src/users/entities/user.entity';
import { Defect, DefectStatus } from 'src/defects/entities/defect.entity';
import { InspectionSummaryItem } from 'src/inspection-summary-items/entities/inspection-summary-item.entity';
@Injectable()
export class InspectionRoundsService {
  constructor(
    @InjectRepository(InspectionRound)
    private readonly inspectionRoundsRepo: Repository<InspectionRound>,
    @InjectRepository(InspectionJob)
    private readonly inspectionJobsRepo: Repository<InspectionJob>,
    @InjectRepository(InspectionTeamMember)
    private readonly teamMembersRepo: Repository<InspectionTeamMember>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Defect)
    private readonly defectsRepo: Repository<Defect>,
    private readonly dataSource: DataSource,
  ) { }

  async create(
    createInspectionRoundDto: CreateInspectionRoundDto,
  ): Promise<InspectionRound> {
    if (createInspectionRoundDto.scheduledDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const scheduledDate = new Date(createInspectionRoundDto.scheduledDate);
      scheduledDate.setHours(0, 0, 0, 0);

      if (scheduledDate < today) {
        throw new BadRequestException('ไม่สามารถเลือกวันนัดหมายย้อนหลังได้');
      }
    }

    const job = await this.inspectionJobsRepo.findOneByOrFail({
      jobId: createInspectionRoundDto.jobId,
    });

    const latestRound = await this.inspectionRoundsRepo.findOne({
      where: { job: { jobId: job.jobId } },
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

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const round = queryRunner.manager.create(InspectionRound, {
        ...createInspectionRoundDto,
        job,
      });

      const savedRound = await queryRunner.manager.save(round);

      job.status = 'Active';
      await queryRunner.manager.save(job);

      if (createInspectionRoundDto.teamMemberId) {
        const teamMember = await queryRunner.manager.findOneByOrFail(
          InspectionTeamMember,
          {
            id: createInspectionRoundDto.teamMemberId,
          },
        );
        teamMember.round = savedRound;
        await queryRunner.manager.save(teamMember);
      }

      if (latestRound) {
        // Copy summaryCompletedAt from the previous round so UI recognizes summary as completed
        savedRound.summaryCompletedAt = latestRound.summaryCompletedAt;
        await queryRunner.manager.save(savedRound);

        const latestItems = await queryRunner.manager.find(InspectionSummaryItem, {
          where: { round: { roundId: latestRound.roundId } },
          relations: ['template', 'option', 'refItem'],
        });

        if (latestItems.length > 0) {
          const clonedItems = latestItems.map((item) =>
            queryRunner.manager.create(InspectionSummaryItem, {
              round: savedRound,
              template: item.template,
              option: item.option,
              refItem: item.refItem,
              detailValue: item.detailValue,
            })
          );
          await queryRunner.manager.save(clonedItems);
        }

        const latestDefects = await queryRunner.manager.find(Defect, {
          where: { round: { roundId: latestRound.roundId } },
          relations: ['room', 'subRoom', 'floor', 'subCategories', 'inspector'],
        });

        if (latestDefects.length > 0) {
          const clonedDefects = latestDefects.map((defect) =>
            queryRunner.manager.create(Defect, {
              ...defect,
              defectId: undefined,
              createdAt: undefined,
              updatedAt: undefined,
              round: savedRound,
            })
          );
          await queryRunner.manager.save(clonedDefects);
        }
      }

      await queryRunner.commitTransaction();
      return savedRound;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async backfillSummaries() {
    const rounds = await this.inspectionRoundsRepo.find({
      relations: ['job'],
    });

    let backfilledCount = 0;

    for (const round of rounds) {
      if (round.roundNumber > 1) {
        const existingItems = await this.dataSource.manager.find(InspectionSummaryItem, {
          where: { round: { roundId: round.roundId } }
        });

        if (existingItems.length === 0) {
          const previousRound = await this.inspectionRoundsRepo.findOne({
            where: { job: { jobId: round.job.jobId }, roundNumber: round.roundNumber - 1 }
          });

          if (previousRound) {
            const previousItems = await this.dataSource.manager.find(InspectionSummaryItem, {
              where: { round: { roundId: previousRound.roundId } },
              relations: ['template', 'option', 'refItem']
            });

            if (previousItems.length > 0) {
              const clonedItems = previousItems.map(item => this.dataSource.manager.create(InspectionSummaryItem, {
                round: round,
                template: item.template,
                option: item.option,
                refItem: item.refItem,
                detailValue: item.detailValue
              }));
              await this.dataSource.manager.save(clonedItems);
              backfilledCount++;
            }
          }
        }
      }
    }
    return backfilledCount;
  }

  async fixJobStatuses() {
    const jobs = await this.inspectionJobsRepo.find();
    let fixedCount = 0;

    for (const job of jobs) {
      const latestRound = await this.inspectionRoundsRepo.findOne({
        where: { job: { jobId: job.jobId } },
        order: { roundNumber: 'DESC' },
      });

      if (latestRound) {
        let expectedStatus = job.status;

        if (latestRound.status === 'APPROVED') {
          if (latestRound.roundNumber >= 2) {
            expectedStatus = 'Completed';
          } else {
            expectedStatus = 'Active';
          }
        } else if (latestRound.status === 'SUBMITTED') {
          expectedStatus = 'Pending';
        } else {
          expectedStatus = 'Active';
        }

        if (job.status !== expectedStatus) {
          job.status = expectedStatus;
          await this.inspectionJobsRepo.save(job);
          fixedCount++;
        }
      }
    }
    return fixedCount;
  }

  findAll() {
    return this.inspectionRoundsRepo.find();
  }

  findOne(id: number) {
    return this.inspectionRoundsRepo.findOneOrFail({
      where: { roundId: id },
      relations: [
        'job',
        'job.address',
        'job.customer',
        'job.houseType',
        'teamMembers',
        'teamMembers.inspector',
        'teamMembers.inspector.team',
        'teamMembers.team',
      ],
    });
  }

  async findByWeek(inspectorId: number, dateString?: string) {
    const baseDate = this.parseDateInput(dateString);
    const startOfWeek = new Date(baseDate);
    startOfWeek.setDate(baseDate.getDate() - baseDate.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return this.findRoundsForInspector(inspectorId, startOfWeek, endOfWeek);
  }

  async findByMonth(inspectorId: number, dateString?: string) {
    const targetDate = this.parseDateInput(dateString);
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();

    const startOfMonth = new Date(year, month, 1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(year, month + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    return this.findRoundsForInspector(inspectorId, startOfMonth, endOfMonth);
  }

  private parseDateInput(dateString?: string): Date {
    if (!dateString) return new Date();

    const [year, month, day] = dateString.split('-').map(Number);
    if (!year || !month || !day) return new Date(dateString);

    return new Date(year, month - 1, day, 12, 0, 0, 0);
  }

  private async findRoundsForInspector(
    inspectorId: number,
    start: Date,
    end: Date,
  ): Promise<InspectionRound[]> {
    const inspector = await this.usersRepo.findOne({
      where: { id: inspectorId },
      relations: ['team'],
    });
    const teamId = inspector?.team?.team_Id || null;

    return this.inspectionRoundsRepo
      .createQueryBuilder('round')
      .leftJoinAndSelect('round.job', 'job')
      .leftJoinAndSelect('job.customer', 'customer')
      .leftJoinAndSelect('job.address', 'address')
      .leftJoinAndSelect('job.houseType', 'houseType')
      .leftJoin('round.teamMembers', 'teamMembers')
      .leftJoin('teamMembers.inspector', 'roundInspector')
      .leftJoin('teamMembers.team', 'roundTeam')
      .where('round.scheduledDate BETWEEN :start AND :end', { start, end })
      .andWhere(
        '(roundInspector.id = :inspectorId OR (roundTeam.team_Id = :teamId AND :teamId IS NOT NULL))',
        { inspectorId, teamId },
      )
      .andWhere('round.deleted_at IS NULL')
      .orderBy('round.scheduledDate', 'ASC')
      .getMany();
  }

  async update(id: number, updateInspectionRoundDto: UpdateInspectionRoundDto) {
    if (updateInspectionRoundDto.scheduledDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const scheduledDate = new Date(updateInspectionRoundDto.scheduledDate);
      scheduledDate.setHours(0, 0, 0, 0);

      if (scheduledDate < today) {
        throw new BadRequestException('ไม่สามารถเลือกวันนัดหมายย้อนหลังได้');
      }
    }

    const round = await this.inspectionRoundsRepo.findOneByOrFail({
      roundId: id,
    });
    Object.assign(round, updateInspectionRoundDto);
    return this.inspectionRoundsRepo.save(round);
  }

  async remove(id: number) {
    const round = await this.inspectionRoundsRepo.findOneByOrFail({
      roundId: id,
    });
    return this.inspectionRoundsRepo.softRemove(round);
  }

  async confirmInspection(id: number) {
    const round = await this.inspectionRoundsRepo.findOneByOrFail({
      roundId: id,
    });
    round.inspectedAt = new Date();
    return this.inspectionRoundsRepo.save(round);
  }

  async confirmSummary(id: number) {
    const round = await this.inspectionRoundsRepo.findOneByOrFail({
      roundId: id,
    });
    round.summaryCompletedAt = new Date();
    return this.inspectionRoundsRepo.save(round);
  }

  async submit(id: number): Promise<InspectionRound> {
    const round = await this.inspectionRoundsRepo.findOneOrFail({
      where: { roundId: id },
      relations: ['job'],
    });

    const isConstruction =
      round.job?.inspectionType === 'CONSTRUCTION_INSPECTION' ||
      round.job?.inspectionType === 'Construction' ||
      round.job?.inspectionType === 'ตรวจก่อสร้าง';

    if (!round.inspectedAt) {
      throw new BadRequestException(
        'ไม่สามารถส่งอนุมัติได้ เนื่องจากยังไม่ได้ยืนยันผลการตรวจ',
      );
    }

    if (!isConstruction && !round.summaryCompletedAt) {
      throw new BadRequestException(
        'ไม่สามารถส่งอนุมัติได้ เนื่องจากยังไม่ได้ยืนยันการสรุปรายงาน',
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      round.status = 'SUBMITTED';
      round.submittedAt = new Date();

      if (round.job) {
        round.job.status = 'Pending';
        await queryRunner.manager.save(round.job);
      }

      const savedRound = await queryRunner.manager.save(round);
      await queryRunner.commitTransaction();
      return savedRound;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async approveReport(
    id: number,
  ): Promise<{ data: InspectionRound; notification: any }> {
    const round = await this.inspectionRoundsRepo.findOneOrFail({
      where: { roundId: id },
      relations: ['job', 'teamMembers', 'teamMembers.inspector'],
    });

    if (round.status !== 'SUBMITTED') {
      throw new BadRequestException('Report must be submitted before approval');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      round.status = 'APPROVED';
      round.approvedAt = new Date();

      if (round.job) {
        if (round.roundNumber >= 2) {
          round.job.status = 'Completed';
        } else {
          round.job.status = 'Active';
        }
        await queryRunner.manager.save(round.job);
      }

      const approvedRound = await queryRunner.manager.save(round);
      await queryRunner.commitTransaction();

      const notification = this.buildApprovalNotification(approvedRound);
      return {
        data: approvedRound,
        notification,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private buildApprovalNotification(round: InspectionRound) {
    const primaryInspectorId = round.teamMembers?.[0]?.inspector?.id ?? null;
    return {
      type: 'REPORT_APPROVED',
      recipientUserId: primaryInspectorId,
      title: 'Report approved',
      message: `Inspection report #${round.roundId} has been approved.`,
      payload: {
        roundId: round.roundId,
        jobId: round.job?.jobId ?? null,
        status: round.status,
        approvedAt: round.approvedAt,
      },
    };
  }
}
