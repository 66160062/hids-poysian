import { Module } from '@nestjs/common';
import { InspectionJobsService } from './inspection-jobs.service';
import { InspectionJobsController } from './inspection-jobs.controller';

@Module({
  controllers: [InspectionJobsController],
  providers: [InspectionJobsService],
})
export class InspectionJobsModule {}
