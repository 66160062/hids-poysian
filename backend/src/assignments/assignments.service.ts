/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Assignment } from './entities/assignment.entity';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { InspectionJob } from 'src/inspection-jobs/entities/inspection-job.entity';
import { User } from 'src/users/entities/user.entity';
import { JOB_STATUSES_BLOCKING_UNASSIGN } from './assignments.constants';

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

    const duplicate = await this.assignmentsRepo.findOne({
      where: {
        job: { jobId: dto.jobId },
        inspector: { id: dto.inspectorId },
      },
    });
    if (duplicate) {
      throw new BadRequestException(
        'ผู้ตรวจคนนี้ถูกมอบหมายในงานนี้แล้ว ไม่สามารถมอบหมายซ้ำได้',
      );
    }

    const assignment = this.assignmentsRepo.create({ job, inspector });
    return this.assignmentsRepo.save(assignment);
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
