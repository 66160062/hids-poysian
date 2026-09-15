import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AdminGuard } from './admin.guard';

function contextWithUser(user?: { role?: string }): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('AdminGuard', () => {
  const guard = new AdminGuard();

  it('allows an admin', () => {
    expect(guard.canActivate(contextWithUser({ role: 'admin' }))).toBe(true);
  });

  it.each(['inspector', 'contractor', 'customer'])('rejects %s', (role) => {
    expect(() => guard.canActivate(contextWithUser({ role }))).toThrow(
      ForbiddenException,
    );
  });

  it('rejects a request without a user', () => {
    expect(() => guard.canActivate(contextWithUser())).toThrow(
      ForbiddenException,
    );
  });
});
