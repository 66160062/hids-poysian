import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import type { JwtPayload } from 'jsonwebtoken';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: { signAsync: jest.Mock };

  beforeEach(async () => {
    jwtService = {
      signAsync: jest.fn().mockResolvedValue('signed-link-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: {} },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('generates a short-lived link token with project_id, exp, and role', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(1_000_000);
    process.env.LINK_BASE_URL = 'https://hids.example.com/';

    await expect(service.generateLinkToken(12, 'customer')).resolves.toEqual({
      token: 'signed-link-token',
      url: 'https://hids.example.com/auth/verify-link?token=signed-link-token',
      expires_at: 1900,
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

  it('creates a real JWT that expires in 15 minutes', async () => {
    const realJwtService = new JwtService({
      secret: 'test-secret',
      signOptions: { expiresIn: '1h' },
    });
    const realService = new AuthService({} as UsersService, realJwtService);
    jest.spyOn(Date, 'now').mockReturnValue(1_000_000);

    const { token } = await realService.generateLinkToken(12, 'customer');
    const decoded = realJwtService.decode(token);

    expect(decoded.project_id).toBe(12);
    expect(decoded.role).toBe('customer');
    expect(decoded.exp).toBe(1900);
  });

  it('verifies a link token and rejects a missing token', async () => {
    const realJwtService = new JwtService({ secret: 'test-secret' });
    const realService = new AuthService({} as UsersService, realJwtService);
    const { token } = await realService.generateLinkToken(12, 'customer');

    await expect(realService.verifyLinkToken(token)).resolves.toMatchObject({
      project_id: 12,
      role: 'customer',
    });
    await expect(realService.verifyLinkToken('')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
