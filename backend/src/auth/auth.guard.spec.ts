import { UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { JwtService } from '@nestjs/jwt';

function createContext(headers: Record<string, unknown>): ExecutionContext {
  const request: Record<string, unknown> = { headers };
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as ExecutionContext;
}

describe('AuthGuard', () => {
  let jwtService: { verify: jest.Mock };
  let guard: AuthGuard;

  beforeEach(() => {
    jwtService = { verify: jest.fn() };
    guard = new AuthGuard(jwtService as unknown as JwtService);
  });

  it('rejects requests with no Authorization header', () => {
    expect(() => guard.canActivate(createContext({}))).toThrow(
      UnauthorizedException,
    );
  });

  it('rejects an Authorization header with no token after the scheme', () => {
    expect(() =>
      guard.canActivate(createContext({ authorization: 'Bearer' })),
    ).toThrow(UnauthorizedException);
  });

  it('rejects an invalid or expired token', () => {
    jwtService.verify.mockImplementation(() => {
      throw new Error('jwt expired');
    });

    expect(() =>
      guard.canActivate(createContext({ authorization: 'Bearer bad-token' })),
    ).toThrow(UnauthorizedException);
  });

  it('attaches the decoded payload to the request and allows the call through', () => {
    jwtService.verify.mockReturnValue({ sub: 1, role: 'admin' });
    const context = createContext({ authorization: 'Bearer good-token' });

    expect(guard.canActivate(context)).toBe(true);
    expect(jwtService.verify).toHaveBeenCalledWith('good-token', {
      secret: 'secretKey',
    });
    expect(
      (context.switchToHttp().getRequest() as { user: unknown }).user,
    ).toEqual({ sub: 1, role: 'admin' });
  });
});
