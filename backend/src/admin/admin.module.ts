import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { InspectionJob } from '../inspection-jobs/entities/inspection-job.entity';
import { InspectionRound } from '../inspection-rounds/entities/inspection-round.entity';
import { Defect } from '../defects/entities/defect.entity';

@Module({
  imports: [TypeOrmModule.forFeature([InspectionJob, InspectionRound, Defect])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
