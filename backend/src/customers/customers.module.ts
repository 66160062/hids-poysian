import { Module } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from './entities/customer.entity';
import { InspectionJob } from 'src/inspection-jobs/entities/inspection-job.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Customer, InspectionJob])],
  controllers: [CustomersController],
  providers: [CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {}
