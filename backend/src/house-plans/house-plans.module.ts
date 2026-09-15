import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HousePlan } from './entities/house-plan.entity';
import { InspectionJob } from 'src/inspection-jobs/entities/inspection-job.entity';
import { Floor } from 'src/floor/entities/floor.entity';
import { HousePlansService } from './house-plans.service';
import { HousePlansController } from './house-plans.controller';
import { StorageModule } from 'src/storage/storage.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([HousePlan, InspectionJob, Floor]),
    StorageModule,
    AuthModule,
  ],
  controllers: [HousePlansController],
  providers: [HousePlansService],
  exports: [HousePlansService],
})
export class HousePlansModule {}
