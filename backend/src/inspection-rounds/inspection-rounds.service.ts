import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateInspectionRoundDto } from './dto/create-inspection-round.dto';
import { UpdateInspectionRoundDto } from './dto/update-inspection-round.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { InspectionRound } from './entities/inspection-round.entity';
import { Repository } from 'typeorm';
import { InspectionTeamMember } from 'src/inspection-team-members/entities/inspection-team-member.entity';
import { InspectionJob } from 'src/inspection-jobs/entities/inspection-job.entity';
import { User } from 'src/users/entities/user.entity';
import { Defect, DefectStatus } from 'src/defects/entities/defect.entity';

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
  ) {}

  async create(createInspectionRoundDto: CreateInspectionRoundDto) {
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

    const round = this.inspectionRoundsRepo.create({
      ...createInspectionRoundDto,
      job,
    });

    const savedRound = await this.inspectionRoundsRepo.save(round);

    job.status = 'Active';
    await this.inspectionJobsRepo.save(job);

    if (createInspectionRoundDto.teamMemberId) {
      const teamMember = await this.teamMembersRepo.findOneByOrFail({
        id: createInspectionRoundDto.teamMemberId,
      });
      teamMember.round = savedRound;
      await this.teamMembersRepo.save(teamMember);
    }

    return savedRound;
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

  async submit(id: number) {
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

    round.status = 'SUBMITTED';
    round.submittedAt = new Date();

    if (round.job) {
      round.job.status = 'Pending';
      await this.inspectionJobsRepo.save(round.job);
    }

    return this.inspectionRoundsRepo.save(round);
  }

  async approveReport(id: number) {
    const round = await this.inspectionRoundsRepo.findOneOrFail({
      where: { roundId: id },
      relations: ['job', 'teamMembers', 'teamMembers.inspector'],
    });

    if (round.status !== 'SUBMITTED') {
      throw new BadRequestException('Report must be submitted before approval');
    }

    round.status = 'APPROVED';
    round.approvedAt = new Date();

    if (round.job) {
      round.job.status = 'Completed';
      await this.inspectionJobsRepo.save(round.job);
    }

    const approvedRound = await this.inspectionRoundsRepo.save(round);
    const notification = this.buildApprovalNotification(approvedRound);

    return {
      data: approvedRound,
      notification,
    };
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
