import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, ForbiddenException } from '@nestjs/common';
import { RatingsService } from './ratings.service';
import { Rating } from './entities/rating.entity';
import { InspectionJob } from 'src/inspection-jobs/entities/inspection-job.entity';

describe('RatingsService', () => {
  let service: RatingsService;
  let ratingsRepo: { findOneBy: jest.Mock; create: jest.Mock; save: jest.Mock };
  let jobsRepo: { findOneByOrFail: jest.Mock };

  const customerLink = { project_id: 1, role: 'customer' };
  const dto = { score: 5, comment: '  ดีมาก  ', token: 'link-token' };

  beforeEach(async () => {
    ratingsRepo = {
      findOneBy: jest.fn().mockResolvedValue(null),
      create: jest.fn((value: unknown) => value),
      save: jest.fn((value: unknown) => Promise.resolve(value)),
    };
    jobsRepo = { findOneByOrFail: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RatingsService,
        { provide: getRepositoryToken(Rating), useValue: ratingsRepo },
        { provide: getRepositoryToken(InspectionJob), useValue: jobsRepo },
      ],
    }).compile();

    service = module.get<RatingsService>(RatingsService);
  });

  it('rejects links that are not customer links', async () => {
    await expect(
      service.create(dto, { project_id: 1, role: 'contractor' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects a second rating from the same link', async () => {
    ratingsRepo.findOneBy.mockResolvedValue({ ratingId: 1 });

    await expect(service.create(dto, customerLink)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('rejects a rating while the job is not closed yet', async () => {
    jobsRepo.findOneByOrFail.mockResolvedValue({ jobId: 1, status: 'Pending' });

    await expect(service.create(dto, customerLink)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(ratingsRepo.save).not.toHaveBeenCalled();
  });

  it('saves the rating with a trimmed comment once the job is closed', async () => {
    const job = { jobId: 1, status: 'Completed' };
    jobsRepo.findOneByOrFail.mockResolvedValue(job);

    await service.create(dto, customerLink);

    expect(ratingsRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ score: 5, comment: 'ดีมาก', job }),
    );
  });
});
