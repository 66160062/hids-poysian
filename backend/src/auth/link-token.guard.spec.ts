import { UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { LinkTokenGuard } from './link-token.guard';
import { AuthService } from './auth.service';

function createContext(request: Record<string, unknown>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as ExecutionContext;
}

describe('LinkTokenGuard', () => {
  let authService: { verifyLinkToken: jest.Mock };
  let guard: LinkTokenGuard;

  beforeEach(() => {
    authService = {
      verifyLinkToken: jest.fn().mockResolvedValue({
        project_id: 12,
        role: 'customer',
      }),
    };
    guard = new LinkTokenGuard(authService as unknown as AuthService);
  });

  it('allows requests with a valid token from query params', async () => {
    const request = { query: { token: 'valid-token' } };

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);

    expect(authService.verifyLinkToken).toHaveBeenCalledWith('valid-token');
    expect(request).toMatchObject({
      user: { project_id: 12, role: 'customer' },
    });
  });

  it('returns 401 when token is missing, invalid, or expired', async () => {
    await expect(guard.canActivate(createContext({ query: {} }))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    authService.verifyLinkToken.mockRejectedValueOnce(new Error('jwt expired'));

    await expect(
      guard.canActivate(createContext({ query: { token: 'expired-token' } })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
