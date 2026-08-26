import { Module } from '@nestjs/common';
import { InspectionJobsService } from './inspection-jobs.service';
import { InspectionJobsController } from './inspection-jobs.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InspectionJob } from './entities/inspection-job.entity';
import { CustomersModule } from 'src/customers/customers.module';
import { AddressesModule } from 'src/addresses/addresses.module';
import { HouseTypesModule } from 'src/house-types/house-types.module';
import { ContractorModule } from 'src/contractor/contractor.module';
import { AuthModule } from 'src/auth/auth.module';
import { Branch } from 'src/branches/entities/branch.entity';
import { BranchesModule } from 'src/branches/branches.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([InspectionJob, Branch]),
    CustomersModule,
    AddressesModule,
    HouseTypesModule,
    ContractorModule,
    AuthModule,
    BranchesModule,
  ],
  controllers: [InspectionJobsController],
  providers: [InspectionJobsService],
  exports: [InspectionJobsService, TypeOrmModule],
})
export class InspectionJobsModule {}
