import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { InspectionJob } from 'src/inspection-jobs/entities/inspection-job.entity';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: { signAsync: jest.Mock; verifyAsync: jest.Mock };
  let jobsRepo: {
    findOneBy: jest.Mock;
    save: jest.Mock;
  };

  beforeEach(async () => {
    jwtService = {
      signAsync: jest.fn().mockResolvedValue('signed-link-token'),
      verifyAsync: jest.fn(),
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

  it('generates a short-lived customer link token', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(1_000_000);
    process.env.LINK_BASE_URL = 'https://hids.example.com/';

    await expect(service.generateLinkToken(12, 'customer')).resolves.toEqual({
      token: 'signed-link-token',
      url: 'https://hids.example.com/#/view/prj-12?token=signed-link-token',
      role: 'customer',
      expires_at: 1900,
      admin_controlled: false,
    });

    expect(jwtService.signAsync).toHaveBeenCalledWith(
      {
        project_id: 12,
        role: 'customer',
      },
      { expiresIn: 900 },
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

    await expect(service.generateLinkToken(12, 'contractor')).resolves.toMatchObject({
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

    await expect(service.generateLinkToken(12, 'contractor')).resolves.toMatchObject({
      token: 'existing-token',
      contractor_share_enabled: true,
    });

    expect(jobsRepo.save).not.toHaveBeenCalled();
  });

  it('creates a real JWT that expires in 15 minutes for customer links', async () => {
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
    const decoded = realJwtService.decode(token) as {
      project_id: number;
      role: string;
      exp: number;
    };

    expect(decoded.project_id).toBe(12);
    expect(decoded.role).toBe('customer');
    expect(decoded.exp).toBe(1900);
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

    await expect(service.verifyLinkToken('signed-link-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
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
});
