import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: { login: jest.Mock; generateLinkToken: jest.Mock };

  beforeEach(async () => {
    authService = {
      login: jest.fn(),
      generateLinkToken: jest.fn().mockResolvedValue({ token: 'token' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('passes generate-link query params to the auth service', () => {
    void controller.generateLink(7, 'contractor');

    expect(authService.generateLinkToken).toHaveBeenCalledWith(7, 'contractor');
  });

  it('returns verified link payload from request user', () => {
    expect(
      controller.verifyLink({
        user: { project_id: 7, role: 'contractor' },
      }),
    ).toEqual({
      valid: true,
      payload: { project_id: 7, role: 'contractor' },
    });
  });
});
