import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InspectionTeamMember } from './entities/inspection-team-member.entity';
import { CreateInspectionTeamMemberDto } from './dto/create-inspection-team-member.dto';
import { InspectionRound } from 'src/inspection-rounds/entities/inspection-round.entity';
import { InspectionJob } from 'src/inspection-jobs/entities/inspection-job.entity';
import { User } from 'src/users/entities/user.entity';
import { InspectionJobStatus } from 'src/inspection-jobs/enums/inspection-job-status.enum';
import { Team } from 'src/teams/entities/team.entity';

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
    @InjectRepository(InspectionRound)
    private readonly roundsRepo: Repository<InspectionRound>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Team)
    private readonly teamRepo: Repository<Team>,
  ) {}

  // เปลี่ยนชื่อจาก assign -> create (ล้อตามชื่อเดิมของเพื่อนใน controller) แต่ไส้ในเป็นของคุณเป๊ะๆ
  async create(dto: CreateInspectionTeamMemberDto) {
    const job = await this.jobsRepo.findOne({ where: { jobId: dto.jobId } });
    if (!job) {
      throw new NotFoundException(`ไม่พบงานตรวจ ID ${dto.jobId}`);
    }

    const round = await this.roundsRepo.findOne({
      where: { job: { jobId: dto.jobId } },
      order: { roundNumber: 'DESC' },
    });

    if (!round) {
      throw new NotFoundException(`ไม่พบรอบการตรวจสำหรับงาน ID ${dto.jobId}`);
    }

    if (!dto.inspectorId && !dto.teamId) {
      throw new BadRequestException(
        'ต้องระบุผู้ตรวจหรือทีมอย่างน้อยหนึ่งอย่าง',
      );
    }

    let inspector: User | null = null;
    let teamEntity: Team | null = null;

    if (dto.inspectorId) {
      inspector = await this.usersRepo.findOne({
        where: { id: dto.inspectorId },
      });
      if (!inspector) {
        throw new NotFoundException(`ไม่พบผู้ตรวจ ID ${dto.inspectorId}`);
      }
    }

    if (dto.teamId) {
      teamEntity = await this.teamRepo.findOne({
        where: { team_Id: dto.teamId },
      });
      if (!teamEntity) {
        throw new NotFoundException(`ไม่พบทีม ID ${dto.teamId}`);
      }
    }

    const duplicate = await this.teamsRepo.findOne({
      where: {
        round: { roundId: round.roundId },
        inspector: inspector ? { id: inspector.id } : undefined,
        team: teamEntity ? { team_Id: teamEntity.team_Id } : undefined,
      },
    });

    if (duplicate) {
      throw new BadRequestException(
        'การมอบหมายนี้ถูกสร้างในรอบนี้แล้ว ไม่สามารถมอบหมายซ้ำได้',
      );
    }

    const teamMember = this.teamsRepo.create({
      round,
      inspector,
      team: teamEntity,
    });
    return this.teamsRepo.save(teamMember);
  }

  async findByJob(jobId: number): Promise<InspectorChip[]> {
    await this.assertJobExists(jobId);

    const latestRound = await this.roundsRepo.findOne({
      where: { job: { jobId } },
      order: { roundNumber: 'DESC' },
    });

    if (!latestRound) return [];

    const rows = await this.teamsRepo.find({
      where: { round: { roundId: latestRound.roundId } },
      relations: ['inspector', 'team'],
      order: { assignedAt: 'ASC' },
    });
    return rows.map((row) => this.toInspectorChip(row));
  }

  findByProject(projectId: number): Promise<InspectorChip[]> {
    return this.findByJob(projectId);
  }

  async remove(id: number) {
    const assignment = await this.teamsRepo.findOne({
      where: { id },
      relations: ['round'],
    });
    if (!assignment) {
      throw new NotFoundException(`ไม่พบการมอบหมาย ID ${id}`);
    }

    const status = assignment.round
      .status as (typeof JOB_STATUSES_BLOCKING_UNASSIGN)[number];
    if (JOB_STATUSES_BLOCKING_UNASSIGN.includes(status)) {
      throw new BadRequestException(
        `ไม่สามารถยกเลิกการมอบหมายได้ เนื่องจากงานอยู่ในสถานะ ${assignment.round.status} (ระบบล็อก)`,
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
    const { inspector, team } = row;

    // If it's a team assignment without an inspector
    if (!inspector && team) {
      return {
        assignmentId: row.id,
        id: team.team_Id,
        fullName: team.team_name,
        info: `ทีมงาน · ${team.contact_info || 'ไม่มีข้อมูลติดต่อ'}`,
        imageUrl: team.logo_url || '/project-images/unknown.jpg',
      };
    }

    // Default to inspector if exists
    return {
      assignmentId: row.id,
      id: inspector!.id,
      fullName: inspector!.fullName,
      info: `${inspector!.role} · ${inspector!.phoneNumber}`,
      imageUrl: inspector!.imageUrl,
    };
  }
}
