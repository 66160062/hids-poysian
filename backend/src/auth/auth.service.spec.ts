import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { IsNull } from 'typeorm';
import { InspectionJob } from 'src/inspection-jobs/entities/inspection-job.entity';
import { InspectionRound } from 'src/inspection-rounds/entities/inspection-round.entity';
import { Assignment } from 'src/assignments/entities/assignment.entity';
import { InspectionTeamMember } from 'src/inspection-team-members/entities/inspection-team-member.entity';
import { User } from 'src/users/entities/user.entity';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: {
    signAsync: jest.Mock;
    verifyAsync: jest.Mock;
    verify: jest.Mock;
  };
  let jobsRepo: {
    findOneBy: jest.Mock;
    save: jest.Mock;
  };
  let assignmentsRepo: { findOne: jest.Mock };
  let teamMembersRepo: { findOne: jest.Mock };
  let authUsersRepo: { findOne: jest.Mock };

  beforeEach(async () => {
    jwtService = {
      signAsync: jest.fn().mockResolvedValue('signed-link-token'),
      verifyAsync: jest.fn(),
      verify: jest.fn(),
    };
    jobsRepo = {
      findOneBy: jest.fn(),
      save: jest.fn(),
    };
    assignmentsRepo = { findOne: jest.fn() };
    teamMembersRepo = { findOne: jest.fn() };
    authUsersRepo = { findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: {} },
        { provide: JwtService, useValue: jwtService },
        {
          provide: getRepositoryToken(InspectionJob),
          useValue: jobsRepo,
        },
        {
          provide: getRepositoryToken(Assignment),
          useValue: assignmentsRepo,
        },
        {
          provide: getRepositoryToken(InspectionTeamMember),
          useValue: teamMembersRepo,
        },
        {
          provide: getRepositoryToken(User),
          useValue: authUsersRepo,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('generates a year-lived customer link token', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(1_000_000);
    process.env.LINK_BASE_URL = 'https://hids.example.com/';

    await expect(service.generateLinkToken(12, 'customer')).resolves.toEqual({
      token: 'signed-link-token',
      url: 'https://hids.example.com/#/view/prj-12?token=signed-link-token',
      role: 'customer',
      expires_at: 31_537_000,
      admin_controlled: false,
    });

    expect(jwtService.signAsync).toHaveBeenCalledWith(
      {
        project_id: 12,
        role: 'customer',
      },
      { expiresIn: 31_536_000 },
    );

    delete process.env.LINK_BASE_URL;
  });

  it('generates an admin-controlled contractor link token', async () => {
    jobsRepo.findOneBy.mockResolvedValue({
      jobId: 12,
      contractorShareGeneration: 1,
      contractorShareEnabled: false,
      contractorShareToken: null,
    });
    jobsRepo.save.mockResolvedValue({});

    await expect(
      service.generateLinkToken(12, 'contractor'),
    ).resolves.toMatchObject({
      token: 'signed-link-token',
      role: 'contractor',
      admin_controlled: true,
      contractor_share_enabled: true,
      expires_at: null,
    });

    expect(jobsRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        contractorShareEnabled: true,
        contractorShareGeneration: 2,
        contractorShareToken: 'signed-link-token',
      }),
    );
  });

  it('reuses existing contractor link token when still enabled', async () => {
    jobsRepo.findOneBy.mockResolvedValue({
      jobId: 12,
      contractorShareGeneration: 2,
      contractorShareEnabled: true,
      contractorShareToken: 'existing-token',
    });

    await expect(
      service.generateLinkToken(12, 'contractor'),
    ).resolves.toMatchObject({
      token: 'existing-token',
      contractor_share_enabled: true,
    });

    expect(jobsRepo.save).not.toHaveBeenCalled();
  });

  it('creates a real JWT that expires in 1 year for customer links', async () => {
    const realJwtService = new JwtService({
      secret: 'test-secret',
      signOptions: { expiresIn: '1h' },
    });
    const realService = new AuthService(
      {} as UsersService,
      realJwtService,
      jobsRepo as never,
      assignmentsRepo as never,
      teamMembersRepo as never,
      authUsersRepo as never,
    );
    jest.spyOn(Date, 'now').mockReturnValue(1_000_000);

    const { token } = await realService.generateLinkToken(12, 'customer');
    const decoded = realJwtService.decode(token);

    expect(decoded.project_id).toBe(12);
    expect(decoded.role).toBe('customer');
    expect(decoded.exp).toBe(31_537_000);
  });

  it('verifies customer link token and rejects revoked contractor links', async () => {
    jwtService.verifyAsync.mockResolvedValue({
      project_id: 12,
      role: 'contractor',
      generation: 2,
    });
    jobsRepo.findOneBy.mockResolvedValue({
      jobId: 12,
      contractorShareEnabled: false,
      contractorShareToken: 'signed-link-token',
      contractorShareGeneration: 2,
    });

    await expect(
      service.verifyLinkToken('signed-link-token'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(service.verifyLinkToken('')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('revokes contractor share link', async () => {
    jobsRepo.findOneBy.mockResolvedValue({
      jobId: 12,
      contractorShareEnabled: true,
      contractorShareToken: 'signed-link-token',
    });
    jobsRepo.save.mockResolvedValue({});

    await expect(service.revokeContractorShare(12)).resolves.toEqual({
      contractor_share_enabled: false,
      message: 'ปิดลิงก์ผู้รับเหมาแล้ว',
    });

    expect(jobsRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        contractorShareEnabled: false,
        contractorShareToken: null,
      }),
    );
  });

  describe('tryVerifyBearerToken', () => {
    it('returns null when no header is present', () => {
      expect(service.tryVerifyBearerToken(undefined)).toBeNull();
    });

    it('returns null when the header has no token part', () => {
      expect(service.tryVerifyBearerToken('Bearer')).toBeNull();
    });

    it('returns null when the token fails verification', () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('invalid');
      });

      expect(service.tryVerifyBearerToken('Bearer bad-token')).toBeNull();
    });

    it('returns the decoded payload for a valid staff token', () => {
      jwtService.verify.mockReturnValue({ sub: 1, role: 'admin' });

      expect(service.tryVerifyBearerToken('Bearer good-token')).toEqual({
        sub: 1,
        role: 'admin',
      });
    });
  });

  describe('verifyJobAccess', () => {
    it('trusts a valid staff Bearer token regardless of jobId', async () => {
      jwtService.verify.mockReturnValue({ sub: 1, role: 'admin' });

      await expect(
        service.verifyJobAccess('Bearer good-token', undefined, 999),
      ).resolves.toEqual({ sub: 1, role: 'admin' });
    });

    it('rejects when there is no staff token and no link token', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('invalid');
      });

      await expect(
        service.verifyJobAccess(undefined, undefined, 12),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('allows a link token whose project_id matches the requested job', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('invalid');
      });
      jwtService.verifyAsync.mockResolvedValue({
        project_id: 12,
        role: 'customer',
      });

      await expect(
        service.verifyJobAccess(undefined, 'link-token', 12),
      ).resolves.toEqual({ project_id: 12, role: 'customer' });
    });

    it('rejects a link token whose project_id does not match the requested job', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('invalid');
      });
      jwtService.verifyAsync.mockResolvedValue({
        project_id: 12,
        role: 'customer',
      });

      await expect(
        service.verifyJobAccess(undefined, 'link-token', 99),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('allows an inspector who is assigned to the job', async () => {
      jwtService.verify.mockReturnValue({ sub: 7, role: 'inspector' });
      assignmentsRepo.findOne.mockResolvedValue({ id: 1 });

      await expect(
        service.verifyJobAccess('Bearer token', undefined, 12),
      ).resolves.toEqual({ sub: 7, role: 'inspector' });

      expect(assignmentsRepo.findOne).toHaveBeenCalledWith({
        where: { job: { jobId: 12 }, inspector: { id: 7 }, round: IsNull() },
      });
    });

    it('rejects an inspector who is not assigned to the job', async () => {
      jwtService.verify.mockReturnValue({ sub: 7, role: 'inspector' });
      assignmentsRepo.findOne.mockResolvedValue(null);
      authUsersRepo.findOne.mockResolvedValue(null);

      await expect(
        service.verifyJobAccess('Bearer token', undefined, 12),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('allows an inspector whose team (not the inspector directly) is assigned to a round of the job', async () => {
      jwtService.verify.mockReturnValue({ sub: 7, role: 'inspector' });
      assignmentsRepo.findOne.mockResolvedValue(null);
      authUsersRepo.findOne.mockResolvedValue({ id: 7, teamId: 3 });
      teamMembersRepo.findOne.mockResolvedValue({ id: 1 });

      await expect(
        service.verifyJobAccess('Bearer token', undefined, 12),
      ).resolves.toEqual({ sub: 7, role: 'inspector' });

      expect(teamMembersRepo.findOne).toHaveBeenCalledWith({
        where: { round: { job: { jobId: 12 } }, team: { team_Id: 3 } },
      });
    });
  });

  describe('verifyRoundAccess', () => {
    const round = { roundId: 5, job: { jobId: 12 } } as InspectionRound;

    it('trusts a valid staff Bearer token for a non-inspector role', async () => {
      jwtService.verify.mockReturnValue({ sub: 1, role: 'admin' });

      await expect(
        service.verifyRoundAccess('Bearer good-token', undefined, round),
      ).resolves.toEqual({ sub: 1, role: 'admin' });
      expect(teamMembersRepo.findOne).not.toHaveBeenCalled();
      expect(assignmentsRepo.findOne).not.toHaveBeenCalled();
    });

    it('allows an inspector assigned directly to the round', async () => {
      jwtService.verify.mockReturnValue({ sub: 7, role: 'inspector' });
      teamMembersRepo.findOne.mockResolvedValue({ id: 1 });
      assignmentsRepo.findOne.mockResolvedValue(null);

      await expect(
        service.verifyRoundAccess('Bearer token', undefined, round),
      ).resolves.toEqual({ sub: 7, role: 'inspector' });
    });

    it('allows an inspector assigned to the parent job even without a round-level entry', async () => {
      jwtService.verify.mockReturnValue({ sub: 7, role: 'inspector' });
      teamMembersRepo.findOne.mockResolvedValue(null);
      assignmentsRepo.findOne.mockResolvedValue({ id: 1 });

      await expect(
        service.verifyRoundAccess('Bearer token', undefined, round),
      ).resolves.toEqual({ sub: 7, role: 'inspector' });
    });

    it('allows an inspector individually assigned to just this round via assignment (not job-wide)', async () => {
      jwtService.verify.mockReturnValue({ sub: 7, role: 'inspector' });
      teamMembersRepo.findOne.mockResolvedValue(null);
      // assignment แถวนี้ผูก round ตรงๆ (round ไม่ใช่ null) — ต้องปลดล็อกแค่รอบนี้ ไม่ใช่ทั้ง job
      // แยกจาก query ของ isInspectorAssignedToJob ด้วยการเช็คว่า where มี job หรือไม่
      assignmentsRepo.findOne.mockImplementation(
        (query: { where: { job?: unknown; round?: unknown } }) =>
          Promise.resolve(
            !query.where.job && query.where.round ? { id: 1 } : null,
          ),
      );
      authUsersRepo.findOne.mockResolvedValue(null);

      await expect(
        service.verifyRoundAccess('Bearer token', undefined, round),
      ).resolves.toEqual({ sub: 7, role: 'inspector' });
    });

    it('rejects an inspector with no assignment to the round or its job', async () => {
      jwtService.verify.mockReturnValue({ sub: 7, role: 'inspector' });
      teamMembersRepo.findOne.mockResolvedValue(null);
      assignmentsRepo.findOne.mockResolvedValue(null);
      authUsersRepo.findOne.mockResolvedValue(null);

      await expect(
        service.verifyRoundAccess('Bearer token', undefined, round),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('allows an inspector whose team (not the inspector directly) was assigned to the round', async () => {
      jwtService.verify.mockReturnValue({ sub: 7, role: 'inspector' });
      // แถวใน inspection_team_member ผูกกับ team (ไม่มี inspector ตรงๆ) — เกิดจากตอน admin
      // เลือกทั้งทีมตอนสร้าง/เปิดรอบ (ดู daily-reports.service.ts resolveTeamMember). ใช้
      // mockImplementation ตาม query แทน mockResolvedValueOnce เพราะ isInspectorAssignedToRound
      // และ isInspectorAssignedToJob รันขนานกันผ่าน Promise.all ลำดับการเรียกจึงไม่แน่นอน
      teamMembersRepo.findOne.mockImplementation(
        (query: { where: { inspector?: unknown; team?: unknown } }) =>
          Promise.resolve(query.where.team ? { id: 1 } : null),
      );
      assignmentsRepo.findOne.mockResolvedValue(null);
      authUsersRepo.findOne.mockResolvedValue({ id: 7, teamId: 3 });

      await expect(
        service.verifyRoundAccess('Bearer token', undefined, round),
      ).resolves.toEqual({ sub: 7, role: 'inspector' });
    });

    it('allows a link token whose project_id matches the round job', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('invalid');
      });
      jwtService.verifyAsync.mockResolvedValue({
        project_id: 12,
        role: 'customer',
      });

      await expect(
        service.verifyRoundAccess(undefined, 'link-token', round),
      ).resolves.toEqual({ project_id: 12, role: 'customer' });
    });

    it('rejects a link token whose project_id does not match the round job', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('invalid');
      });
      jwtService.verifyAsync.mockResolvedValue({
        project_id: 99,
        role: 'customer',
      });

      await expect(
        service.verifyRoundAccess(undefined, 'link-token', round),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });
});
