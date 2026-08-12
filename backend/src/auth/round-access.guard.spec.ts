import type { ExecutionContext } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common';
import { RoundAccessGuard } from './round-access.guard';
import { AuthService } from './auth.service';

function createContext(request: Record<string, unknown>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as ExecutionContext;
}

describe('RoundAccessGuard', () => {
  let authService: { verifyJobAccess: jest.Mock };
  let roundsRepo: { findOne: jest.Mock };
  let guard: RoundAccessGuard;

  beforeEach(() => {
    authService = { verifyJobAccess: jest.fn().mockResolvedValue({ sub: 1 }) };
    roundsRepo = { findOne: jest.fn() };
    guard = new RoundAccessGuard(
      authService as unknown as AuthService,
      roundsRepo as never,
    );
  });

  it('resolves the round to its job before checking access', async () => {
    roundsRepo.findOne.mockResolvedValue({
      roundId: 5,
      job: { jobId: 12 },
    });
    const request = {
      params: { roundId: '5' },
      query: { token: 'link-token' },
      headers: { authorization: 'Bearer staff-token' },
    };

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);

    expect(roundsRepo.findOne).toHaveBeenCalledWith({
      where: { roundId: 5 },
      relations: ['job'],
    });
    expect(authService.verifyJobAccess).toHaveBeenCalledWith(
      'Bearer staff-token',
      'link-token',
      12,
    );
    expect(request).toMatchObject({ user: { sub: 1 } });
  });

  it('falls back to the :id param when there is no :roundId param', async () => {
    roundsRepo.findOne.mockResolvedValue({ roundId: 9, job: { jobId: 3 } });
    const request = { params: { id: '9' }, query: {}, headers: {} };

    await guard.canActivate(createContext(request));

    expect(roundsRepo.findOne).toHaveBeenCalledWith({
      where: { roundId: 9 },
      relations: ['job'],
    });
  });

  it('throws NotFoundException when the round does not exist or has no job', async () => {
    roundsRepo.findOne.mockResolvedValue(null);
    const request = { params: { roundId: '999' }, query: {}, headers: {} };

    await expect(
      guard.canActivate(createContext(request)),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(authService.verifyJobAccess).not.toHaveBeenCalled();
  });
});
