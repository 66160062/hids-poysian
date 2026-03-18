import { Test, TestingModule } from '@nestjs/testing';
import { InspectionJobsController } from './inspection-jobs.controller';
import { InspectionJobsService } from './inspection-jobs.service';

describe('InspectionJobsController', () => {
  let controller: InspectionJobsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InspectionJobsController],
      providers: [InspectionJobsService],
    }).compile();

    controller = module.get<InspectionJobsController>(InspectionJobsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
