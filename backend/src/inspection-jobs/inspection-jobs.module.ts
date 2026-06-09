import { Module } from '@nestjs/common';
import { InspectionJobsService } from './inspection-jobs.service';
import { InspectionJobsController } from './inspection-jobs.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InspectionJob } from './entities/inspection-job.entity';
import { CustomersModule } from 'src/customers/customers.module';
import { AddressesModule } from 'src/addresses/addresses.module';
import { HouseTypesModule } from 'src/house-types/house-types.module';
import { ContractorModule } from 'src/contractor/contractor.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([InspectionJob]),
    CustomersModule,
    AddressesModule,
    HouseTypesModule,
    ContractorModule,
  ],
  controllers: [InspectionJobsController],
  providers: [InspectionJobsService],
  exports: [InspectionJobsService, TypeOrmModule],
})
export class InspectionJobsModule {}
