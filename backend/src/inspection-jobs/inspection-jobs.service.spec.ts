import { Test, TestingModule } from '@nestjs/testing';
import { InspectionJobsService } from './inspection-jobs.service';

describe('InspectionJobsService', () => {
  let service: InspectionJobsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InspectionJobsService],
    }).compile();

    service = module.get<InspectionJobsService>(InspectionJobsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
