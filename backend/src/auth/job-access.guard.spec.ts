import type { ExecutionContext } from '@nestjs/common';
import { JobAccessGuard } from './job-access.guard';
import { AuthService } from './auth.service';

function createContext(request: Record<string, unknown>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as ExecutionContext;
}

describe('JobAccessGuard', () => {
  let authService: { verifyJobAccess: jest.Mock };
  let guard: JobAccessGuard;

  beforeEach(() => {
    authService = { verifyJobAccess: jest.fn().mockResolvedValue({ sub: 1 }) };
    guard = new JobAccessGuard(authService as unknown as AuthService);
  });

  it('reads jobId from the :jobId param and forwards the Bearer header and link token', async () => {
    const request = {
      params: { jobId: '12' },
      query: { token: 'link-token' },
      headers: { authorization: 'Bearer staff-token' },
    };

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);

    expect(authService.verifyJobAccess).toHaveBeenCalledWith(
      'Bearer staff-token',
      'link-token',
      12,
    );
    expect(request).toMatchObject({ user: { sub: 1 } });
  });

  it('falls back to the :id param when there is no :jobId param', async () => {
    const request = { params: { id: '7' }, query: {}, headers: {} };

    await guard.canActivate(createContext(request));

    expect(authService.verifyJobAccess).toHaveBeenCalledWith(
      undefined,
      undefined,
      7,
    );
  });

  it('propagates the rejection from verifyJobAccess', async () => {
    authService.verifyJobAccess.mockRejectedValue(new Error('denied'));
    const request = { params: { jobId: '12' }, query: {}, headers: {} };

    await expect(guard.canActivate(createContext(request))).rejects.toThrow(
      'denied',
    );
  });
});
