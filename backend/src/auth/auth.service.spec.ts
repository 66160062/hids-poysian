import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { InspectionJob } from 'src/inspection-jobs/entities/inspection-job.entity';

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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: {} },
        { provide: JwtService, useValue: jwtService },
        {
          provide: getRepositoryToken(InspectionJob),
          useValue: jobsRepo,
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
  });
});
