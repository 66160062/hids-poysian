import { Module } from '@nestjs/common';
import { InspectionJobsService } from './inspection-jobs.service';
import { InspectionJobsController } from './inspection-jobs.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InspectionJob } from './entities/inspection-job.entity';
import { Customer } from 'src/customers/entities/customer.entity';
import { Address } from 'src/addresses/entities/address.entity';
import { HouseType } from 'src/house-types/entities/house-type.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([InspectionJob, Customer, Address, HouseType]),
  ],
  controllers: [InspectionJobsController],
  providers: [InspectionJobsService],
  exports: [InspectionJobsService],
})
export class InspectionJobsModule {}
