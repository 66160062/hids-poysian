import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { InspectionJob } from 'src/inspection-jobs/entities/inspection-job.entity';
import { InspectionRound } from 'src/inspection-rounds/entities/inspection-round.entity';
import { Assignment } from 'src/assignments/entities/assignment.entity';
import { InspectionTeamMember } from 'src/inspection-team-members/entities/inspection-team-member.entity';
import { User } from 'src/users/entities/user.entity';
import * as bcrypt from 'bcrypt';

const CUSTOMER_LINK_EXPIRES_IN_SECONDS = 365 * 24 * 60 * 60;
const CONTRACTOR_LINK_EXPIRES_IN_SECONDS = 365 * 24 * 60 * 60;

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @InjectRepository(InspectionJob)
    private jobsRepo: Repository<InspectionJob>,
    @InjectRepository(Assignment)
    private assignmentsRepo: Repository<Assignment>,
    @InjectRepository(InspectionTeamMember)
    private teamMembersRepo: Repository<InspectionTeamMember>,
    @InjectRepository(User)
    private authUsersRepo: Repository<User>,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new UnauthorizedException('รหัสผ่านไม่ถูกต้อง');
    return user;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        lineId: user.lineId,
        imageUrl: user.imageUrl,
        teamId: user.teamId || null,
      },
    };
  }

  private buildShareUrl(projectId: number, role: string, token: string) {
    const baseUrl = process.env.LINK_BASE_URL ?? 'http://localhost:9000';
    const pathByRole: Record<string, string> = {
      customer: `/view/prj-${projectId}`,
      contractor: `/fix/prj-${projectId}-con`,
    };
    const path = pathByRole[role] ?? pathByRole.customer;
    return `${baseUrl.replace(/\/$/, '')}/#${path}?token=${encodeURIComponent(token)}`;
  }

  async generateLinkToken(projectId: number, role: string) {
    if (!role) {
      throw new BadRequestException('role is required');
    }

    if (role === 'contractor') {
      return this.generateContractorLinkToken(projectId);
    }

    return this.generateCustomerLinkToken(projectId);
  }

  private async generateCustomerLinkToken(projectId: number) {
    const expiresAt =
      Math.floor(Date.now() / 1000) + CUSTOMER_LINK_EXPIRES_IN_SECONDS;
    const payload = {
      project_id: projectId,
      role: 'customer',
    };
    const token = await this.jwtService.signAsync(payload, {
      expiresIn: CUSTOMER_LINK_EXPIRES_IN_SECONDS,
    });

    return {
      token,
      url: this.buildShareUrl(projectId, 'customer', token),
      role: 'customer',
      expires_at: expiresAt,
      admin_controlled: false,
    };
  }

  private async generateContractorLinkToken(projectId: number) {
    const job = await this.jobsRepo.findOneBy({ jobId: projectId });
    if (!job) {
      throw new NotFoundException(`ไม่พบโครงการ ID ${projectId}`);
    }

    if (job.contractorShareEnabled && job.contractorShareToken) {
      return {
        token: job.contractorShareToken,
        url: this.buildShareUrl(
          projectId,
          'contractor',
          job.contractorShareToken,
        ),
        role: 'contractor',
        expires_at: null,
        admin_controlled: true,
        contractor_share_enabled: true,
      };
    }

    const generation = job.contractorShareGeneration + 1;
    const payload = {
      project_id: projectId,
      role: 'contractor',
      generation,
    };
    const token = await this.jwtService.signAsync(payload, {
      expiresIn: CONTRACTOR_LINK_EXPIRES_IN_SECONDS,
    });

    job.contractorShareEnabled = true;
    job.contractorShareGeneration = generation;
    job.contractorShareToken = token;
    await this.jobsRepo.save(job);

    return {
      token,
      url: this.buildShareUrl(projectId, 'contractor', token),
      role: 'contractor',
      expires_at: null,
      admin_controlled: true,
      contractor_share_enabled: true,
    };
  }

  async getContractorShareStatus(projectId: number) {
    const job = await this.jobsRepo.findOneBy({ jobId: projectId });
    if (!job) {
      throw new NotFoundException(`ไม่พบโครงการ ID ${projectId}`);
    }

    return {
      contractor_share_enabled: job.contractorShareEnabled,
      token: job.contractorShareEnabled ? job.contractorShareToken : null,
    };
  }

  async revokeContractorShare(projectId: number) {
    const job = await this.jobsRepo.findOneBy({ jobId: projectId });
    if (!job) {
      throw new NotFoundException(`ไม่พบโครงการ ID ${projectId}`);
    }

    job.contractorShareEnabled = false;
    job.contractorShareToken = null;
    await this.jobsRepo.save(job);

    return {
      contractor_share_enabled: false,
      message: 'ปิดลิงก์ผู้รับเหมาแล้ว',
    };
  }

  async verifyLinkToken(token: string) {
    if (!token) {
      throw new UnauthorizedException('Token not found');
    }

    const payload = await this.jwtService.verifyAsync<{
      project_id: number;
      role: string;
      generation?: number;
    }>(token);

    if (payload.role === 'contractor') {
      const job = await this.jobsRepo.findOneBy({ jobId: payload.project_id });
      if (
        !job ||
        !job.contractorShareEnabled ||
        job.contractorShareToken !== token ||
        job.contractorShareGeneration !== payload.generation
      ) {
        throw new UnauthorizedException('ลิงก์ถูกปิดโดยผู้ดูแลระบบแล้ว');
      }
    }

    return payload;
  }

  // ใช้โดย JobAccessGuard/RoundAccessGuard: ลอง verify staff/system JWT (Bearer) ก่อน
  // ไม่ throw ถ้าไม่มีหรือไม่ผ่าน — เผื่อ caller อยากลอง fallback เป็น link token ต่อ
  tryVerifyBearerToken(authHeader?: string): Record<string, unknown> | null {
    if (!authHeader) return null;
    const token = authHeader.split(' ')[1];
    if (!token) return null;
    try {
      return this.jwtService.verify<Record<string, unknown>>(token);
    } catch {
      return null;
    }
  }

  // inspector อาจเข้าตาราง team_member ผ่าน "team" (team: entity, inspector: null) แทนที่จะผูก
  // ตัวเองตรงๆ เวลา admin เลือกทั้งทีมตอนสร้าง/เปิดรอบ — ต้อง resolve teamId ของ user ก่อน
  // เพื่อเช็คสิทธิ์แบบ team-based ด้วย ไม่ใช่แค่แถวที่ inspector ผูกตรงๆ
  private async getInspectorTeamId(
    inspectorId: number,
  ): Promise<number | null> {
    const inspector = await this.authUsersRepo.findOne({
      where: { id: inspectorId },
    });
    return inspector?.teamId ?? null;
  }

  // inspector ต้องถูก assign เข้า job นี้จริง ผ่านตาราง assignment แบบ "ทั้ง job"
  // (round เป็น null เท่านั้น — assignment ที่ผูกรอบเฉพาะเจาะจงไม่ควรปลดล็อกทั้ง job)
  // หรือผ่านทีมที่ตัวเองสังกัดถูก assign เข้ารอบใดรอบหนึ่งของ job นี้ (team-based) — admin/role
  // อื่นๆ ไม่ถูกจำกัดด้วยเงื่อนไขนี้ (คงพฤติกรรมเดิม)
  private async isInspectorAssignedToJob(
    inspectorId: number,
    jobId: number,
  ): Promise<boolean> {
    const assignment = await this.assignmentsRepo.findOne({
      where: {
        job: { jobId },
        inspector: { id: inspectorId },
        round: IsNull(),
      },
    });
    if (assignment) return true;

    const teamId = await this.getInspectorTeamId(inspectorId);
    if (!teamId) return false;

    const teamMember = await this.teamMembersRepo.findOne({
      where: { round: { job: { jobId } }, team: { team_Id: teamId } },
    });
    return !!teamMember;
  }

  // เช็คระดับรอบตรวจโดยตรงผ่าน inspection_team_member — ทั้งแถวที่ผูก inspector ตรงๆ
  // (assign เฉพาะบางรอบ ไม่ผูกทั้ง job) และแถวที่ผูกผ่าน "team" ที่ inspector สังกัดอยู่
  // รวมถึงแถว assignment ที่ผูกกับรอบนี้ตรงๆ (round ไม่เป็น null) — คนที่ถูกเพิ่มเข้ารอบนี้
  // เป็นรายบุคคลผ่านหน้า admin โดยไม่ได้อยู่ใน team_member
  private async isInspectorAssignedToRound(
    inspectorId: number,
    roundId: number,
  ): Promise<boolean> {
    const directMember = await this.teamMembersRepo.findOne({
      where: { round: { roundId }, inspector: { id: inspectorId } },
    });
    if (directMember) return true;

    const roundAssignment = await this.assignmentsRepo.findOne({
      where: { round: { roundId }, inspector: { id: inspectorId } },
    });
    if (roundAssignment) return true;

    const teamId = await this.getInspectorTeamId(inspectorId);
    if (!teamId) return false;

    const teamMember = await this.teamMembersRepo.findOne({
      where: { round: { roundId }, team: { team_Id: teamId } },
    });
    return !!teamMember;
  }

  private async assertInspectorPayloadCanAccessJob(
    payload: Record<string, unknown>,
    jobId: number,
  ): Promise<void> {
    if (payload.role !== 'inspector') return;
    const inspectorId = Number(payload.sub);
    const allowed = await this.isInspectorAssignedToJob(inspectorId, jobId);
    if (!allowed) {
      throw new ForbiddenException('คุณไม่มีสิทธิ์เข้าถึงงานนี้');
    }
  }

  // Guard ร่วมสำหรับ endpoint ที่ทั้ง staff (Bearer) และลูกค้า/ผู้รับเหมาที่ถือลิงก์ (?token=)
  // ต้องเข้าถึงได้ — staff ผ่านได้ถ้าเป็น admin เสมอ, ถ้าเป็น inspector ต้องถูก assign เข้า job นี้จริง,
  // ส่วนเจ้าของลิงก์ต้องมี project_id ตรงกับ jobId ของ resource ที่ขอมาเท่านั้น ป้องกันการสลับ jobId ใน URL เพื่อดูงานอื่น
  async verifyJobAccess(
    authHeader: string | undefined,
    linkToken: unknown,
    jobId: number,
  ): Promise<Record<string, unknown>> {
    const staffPayload = this.tryVerifyBearerToken(authHeader);
    if (staffPayload) {
      await this.assertInspectorPayloadCanAccessJob(staffPayload, jobId);
      return staffPayload;
    }

    if (typeof linkToken !== 'string' || !linkToken) {
      throw new UnauthorizedException('Token not found');
    }

    const payload = await this.verifyLinkToken(linkToken);
    if (payload.project_id !== jobId) {
      throw new ForbiddenException('ลิงก์นี้ไม่มีสิทธิ์เข้าถึงข้อมูลนี้');
    }
    return payload;
  }

  // เหมือน verifyJobAccess แต่ใช้กับ resource ที่ผูกกับ "รอบตรวจ" โดยตรง (round) — inspector
  // ผ่านได้ถ้าถูก assign เข้ารอบนี้ตรงๆ (inspection_team_member) หรือถูก assign เข้าทั้ง job (assignment)
  async verifyRoundAccess(
    authHeader: string | undefined,
    linkToken: unknown,
    round: InspectionRound,
  ): Promise<Record<string, unknown>> {
    const staffPayload = this.tryVerifyBearerToken(authHeader);
    if (staffPayload) {
      if (staffPayload.role === 'inspector') {
        const inspectorId = Number(staffPayload.sub);
        const [assignedToRound, assignedToJob] = await Promise.all([
          this.isInspectorAssignedToRound(inspectorId, round.roundId),
          this.isInspectorAssignedToJob(inspectorId, round.job.jobId),
        ]);
        if (!assignedToRound && !assignedToJob) {
          throw new ForbiddenException('คุณไม่มีสิทธิ์เข้าถึงรอบตรวจนี้');
        }
      }
      return staffPayload;
    }

    if (typeof linkToken !== 'string' || !linkToken) {
      throw new UnauthorizedException('Token not found');
    }

    const payload = await this.verifyLinkToken(linkToken);
    if (payload.project_id !== round.job.jobId) {
      throw new ForbiddenException('ลิงก์นี้ไม่มีสิทธิ์เข้าถึงข้อมูลนี้');
    }
    return payload;
  }
}
