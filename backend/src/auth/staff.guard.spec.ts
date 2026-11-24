import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { StaffGuard } from './staff.guard';

function contextWithUser(user?: { role?: string }): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('StaffGuard', () => {
  const guard = new StaffGuard();

  it.each(['inspector', 'admin', 'super_admin'])('allows %s', (role) => {
    expect(guard.canActivate(contextWithUser({ role }))).toBe(true);
  });

  it.each(['contractor', 'customer'])('rejects link-token role %s', (role) => {
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
