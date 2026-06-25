import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InspectionJob } from 'src/inspection-jobs/entities/inspection-job.entity';
import * as bcrypt from 'bcrypt';

const CUSTOMER_LINK_EXPIRES_IN_SECONDS = 15 * 60;
const CONTRACTOR_LINK_EXPIRES_IN_SECONDS = 365 * 24 * 60 * 60;

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @InjectRepository(InspectionJob)
    private jobsRepo: Repository<InspectionJob>,
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
}
