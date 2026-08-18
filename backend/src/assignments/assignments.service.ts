import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Assignment } from './entities/assignment.entity';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { InspectionJob } from 'src/inspection-jobs/entities/inspection-job.entity';
import { User } from 'src/users/entities/user.entity';
import { InspectionRound } from 'src/inspection-rounds/entities/inspection-round.entity';
import { JOB_STATUSES_BLOCKING_UNASSIGN } from './assignments.constants';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationType } from 'src/notifications/entities/notification.entity';
import { MailService } from 'src/mail/mail.service';

export type InspectorChip = {
  assignmentId: number;
  id: number;
  fullName: string;
  info: string;
  imageUrl: string;
};

@Injectable()
export class AssignmentsService {
  constructor(
    @InjectRepository(Assignment)
    private readonly assignmentsRepo: Repository<Assignment>,
    @InjectRepository(InspectionJob)
    private readonly jobsRepo: Repository<InspectionJob>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(InspectionRound)
    private readonly roundsRepo: Repository<InspectionRound>,
    private readonly notificationsService: NotificationsService,
    private readonly mailService: MailService,
  ) {}

  async assign(dto: CreateAssignmentDto) {
    const job = await this.jobsRepo.findOne({ where: { jobId: dto.jobId } });
    if (!job) {
      throw new NotFoundException(`ไม่พบงานตรวจ ID ${dto.jobId}`);
    }

    const inspector = await this.usersRepo.findOne({
      where: { id: dto.inspectorId },
    });
    if (!inspector) {
      throw new NotFoundException(`ไม่พบผู้ตรวจ ID ${dto.inspectorId}`);
    }

    let round: InspectionRound | null = null;
    if (dto.roundId) {
      round = await this.roundsRepo.findOne({
        where: { roundId: dto.roundId },
        relations: ['job'],
      });
      if (!round) {
        throw new NotFoundException(`ไม่พบรอบตรวจ ID ${dto.roundId}`);
      }
      if (round.job.jobId !== dto.jobId) {
        throw new BadRequestException('รอบตรวจนี้ไม่ได้อยู่ในงานนี้');
      }
    }

    const duplicate = await this.assignmentsRepo.findOne({
      where: {
        job: { jobId: dto.jobId },
        inspector: { id: dto.inspectorId },
        round: round ? { roundId: round.roundId } : IsNull(),
      },
    });
    if (duplicate) {
      throw new BadRequestException(
        'ผู้ตรวจคนนี้ถูกมอบหมายในงาน (หรือรอบ) นี้แล้ว ไม่สามารถมอบหมายซ้ำได้',
      );
    }

    const assignment = this.assignmentsRepo.create({ job, inspector, round });
    const saved = await this.assignmentsRepo.save(assignment);

    void this.notificationsService.create({
      type: NotificationType.INFO,
      recipientUserId: inspector.id,
      message: `คุณได้รับมอบหมายงานตรวจ: ${job.projectName}`,
      jobId: job.jobId,
    });

    if (inspector.email) {
      void this.mailService.sendInspectorAssignedEmail({
        to: inspector.email,
        inspectorName: inspector.fullName,
        jobTitle: job.projectName,
        portalUrl: this.buildInspectorPortalUrl(),
      });
    }

    return saved;
  }

  async findByJob(jobId: number): Promise<InspectorChip[]> {
    await this.assertJobExists(jobId);
    const rows = await this.assignmentsRepo.find({
      where: { job: { jobId } },
      relations: ['inspector'],
      order: { assignedAt: 'ASC' },
    });
    return rows.map((row) => this.toInspectorChip(row));
  }

  findByProject(projectId: number): Promise<InspectorChip[]> {
    return this.findByJob(projectId);
  }

  async remove(id: number) {
    const assignment = await this.assignmentsRepo.findOne({
      where: { id },
      relations: ['job'],
    });
    if (!assignment) {
      throw new NotFoundException(`ไม่พบการมอบหมาย ID ${id}`);
    }

    const status = assignment.job
      .status as (typeof JOB_STATUSES_BLOCKING_UNASSIGN)[number];
    if (JOB_STATUSES_BLOCKING_UNASSIGN.includes(status)) {
      throw new BadRequestException(
        `ไม่สามารถยกเลิกการมอบหมายได้ เนื่องจากงานอยู่ในสถานะ ${assignment.job.status} (ระบบล็อก)`,
      );
    }

    await this.assignmentsRepo.softDelete(id);
    return { deleted: true, id };
  }

  private async assertJobExists(jobId: number) {
    const job = await this.jobsRepo.findOne({ where: { jobId } });
    if (!job) {
      throw new NotFoundException(`ไม่พบงานตรวจ ID ${jobId}`);
    }
  }

  private buildInspectorPortalUrl(): string {
    const baseUrl = (
      process.env.FRONTEND_URL ?? 'http://localhost:9000'
    ).replace(/\/$/, '');
    return `${baseUrl}/#/inspector/Inspectsdashboard`;
  }

  private toInspectorChip(row: Assignment): InspectorChip {
    const { inspector } = row;
    return {
      assignmentId: row.id,
      id: inspector.id,
      fullName: inspector.fullName,
      info: `${inspector.role} · ${inspector.phoneNumber}`,
      imageUrl: inspector.imageUrl,
    };
  }
}
