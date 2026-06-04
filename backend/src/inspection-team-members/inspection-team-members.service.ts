/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InspectionTeamMember } from './entities/inspection-team-member.entity';
import { CreateInspectionTeamMemberDto } from './dto/create-inspection-team-member.dto';
import { InspectionJob } from 'src/inspection-jobs/entities/inspection-job.entity';
import { User } from 'src/users/entities/user.entity';
import { InspectionJobStatus } from 'src/inspection-jobs/enums/inspection-job-status.enum';

export const JOB_STATUSES_BLOCKING_UNASSIGN: InspectionJobStatus[] = [
  InspectionJobStatus.Locked,
  InspectionJobStatus.Completed,
  InspectionJobStatus.Cancelled,
];

export type InspectorChip = {
  assignmentId: number;
  id: number;
  fullName: string;
  info: string;
  imageUrl: string;
};

@Injectable()
export class InspectionTeamMembersService {
  constructor(
    @InjectRepository(InspectionTeamMember)
    private readonly teamsRepo: Repository<InspectionTeamMember>,
    @InjectRepository(InspectionJob)
    private readonly jobsRepo: Repository<InspectionJob>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  // เปลี่ยนชื่อจาก assign -> create (ล้อตามชื่อเดิมของเพื่อนใน controller) แต่ไส้ในเป็นของคุณเป๊ะๆ
  async create(dto: CreateInspectionTeamMemberDto) {
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

    const duplicate = await this.teamsRepo.findOne({
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

    const team = this.teamsRepo.create({ job, inspector });
    return this.teamsRepo.save(team);
  }

  async findByJob(jobId: number): Promise<InspectorChip[]> {
    await this.assertJobExists(jobId);
    const rows = await this.teamsRepo.find({
      where: { job: { jobId } },
      relations: ['inspector'],
      order: { assignedAt: 'ASC' }, // หากใน Entity ของเพื่อนไม่มีฟิลด์ assignedAt ให้เปลี่ยนคำนี้เป็น createdAt นะครับ
    });
    return rows.map((row) => this.toInspectorChip(row));
  }

  findByProject(projectId: number): Promise<InspectorChip[]> {
    return this.findByJob(projectId);
  }

  async remove(id: number) {
    const assignment = await this.teamsRepo.findOne({
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

    await this.teamsRepo.softDelete(id);
    return { deleted: true, id };
  }

  private async assertJobExists(jobId: number) {
    const job = await this.jobsRepo.findOne({ where: { jobId } });
    if (!job) {
      throw new NotFoundException(`ไม่พบงานตรวจ ID ${jobId}`);
    }
  }

  private toInspectorChip(row: InspectionTeamMember): InspectorChip {
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
