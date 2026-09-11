import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobPlan } from './entities/job-plan.entity';
import { InspectionJob } from 'src/inspection-jobs/entities/inspection-job.entity';
import { Floor } from 'src/floor/entities/floor.entity';
import { JobPlansService } from './job-plans.service';
import { JobPlansController } from './job-plans.controller';
import { StorageModule } from 'src/storage/storage.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([JobPlan, InspectionJob, Floor]),
    StorageModule,
    AuthModule,
  ],
  controllers: [JobPlansController],
  providers: [JobPlansService],
  exports: [JobPlansService],
})
export class JobPlansModule {}
