import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateInspectionRoundDto } from './dto/create-inspection-round.dto';
import { UpdateInspectionRoundDto } from './dto/update-inspection-round.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { InspectionRound } from './entities/inspection-round.entity';
import { Repository } from 'typeorm';
import { InspectionTeamMember } from 'src/inspection-team-members/entities/inspection-team-member.entity';
import { InspectionJob } from 'src/inspection-jobs/entities/inspection-job.entity';

@Injectable()
export class InspectionRoundsService {
  constructor(
    @InjectRepository(InspectionRound)
    private readonly inspectionRoundsRepo: Repository<InspectionRound>,
    @InjectRepository(InspectionJob)
    private readonly inspectionJobsRepo: Repository<InspectionJob>,
    @InjectRepository(InspectionTeamMember)
    private readonly teamMembersRepo: Repository<InspectionTeamMember>,
  ) {}

  async create(createInspectionRoundDto: CreateInspectionRoundDto) {
    const job = await this.inspectionJobsRepo.findOneByOrFail({
      jobId: createInspectionRoundDto.jobId,
    });

    const teamMember = await this.teamMembersRepo.findOneByOrFail({
      id: createInspectionRoundDto.teamMemberId,
    });

    const round = this.inspectionRoundsRepo.create({
      ...createInspectionRoundDto,
      job,
      teamMember,
    });

    return this.inspectionRoundsRepo.save(round);
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
        'teamMember',
        'teamMember.inspector',
        'teamMember.inspector.team',
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

  private findRoundsForInspector(
    inspectorId: number,
    start: Date,
    end: Date,
  ): Promise<InspectionRound[]> {
    return this.inspectionRoundsRepo
      .createQueryBuilder('round')
      .leftJoinAndSelect('round.job', 'job')
      .leftJoinAndSelect('job.customer', 'customer')
      .leftJoinAndSelect('job.address', 'address')
      .leftJoinAndSelect('job.houseType', 'houseType')
      .leftJoin('round.teamMember', 'teamMember')
      .leftJoin('teamMember.inspector', 'roundInspector')
      .leftJoin(
        InspectionTeamMember,
        'jobAssignment',
        'jobAssignment.job_id = job.jobId AND jobAssignment.deleted_at IS NULL',
      )
      .where('round.scheduledDate BETWEEN :start AND :end', { start, end })
      .andWhere(
        '(roundInspector.id = :inspectorId OR jobAssignment.inspector_id = :inspectorId)',
        { inspectorId },
      )
      .andWhere('round.deleted_at IS NULL')
      .orderBy('round.scheduledDate', 'ASC')
      .getMany();
  }

  async update(id: number, updateInspectionRoundDto: UpdateInspectionRoundDto) {
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
    const round = await this.inspectionRoundsRepo.findOneByOrFail({
      roundId: id,
    });

    if (!round.inspectedAt) {
      throw new BadRequestException(
        'ไม่สามารถส่งอนุมัติได้ เนื่องจากยังไม่ได้ยืนยันผลการตรวจ Defect',
      );
    }

    if (!round.summaryCompletedAt) {
      throw new BadRequestException(
        'ไม่สามารถส่งอนุมัติได้ เนื่องจากยังไม่ได้ยืนยันการสรุปรายงาน',
      );
    }

    round.status = 'SUBMITTED';
    round.submittedAt = new Date();
    return this.inspectionRoundsRepo.save(round);
  }

  async approveReport(id: number) {
    const round = await this.inspectionRoundsRepo.findOneOrFail({
      where: { roundId: id },
      relations: ['job', 'teamMember', 'teamMember.inspector'],
    });

    if (round.status !== 'SUBMITTED') {
      throw new BadRequestException('Report must be submitted before approval');
    }

    round.status = 'APPROVED';
    round.approvedAt = new Date();

    const approvedRound = await this.inspectionRoundsRepo.save(round);
    const notification = this.buildApprovalNotification(approvedRound);

    return {
      data: approvedRound,
      notification,
    };
  }

  private buildApprovalNotification(round: InspectionRound) {
    return {
      type: 'REPORT_APPROVED',
      recipientUserId: round.teamMember?.inspector?.id ?? null,
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
