import { Module } from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { AddressesController } from './addresses.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Address } from './entities/address.entity';
import { InspectionJob } from 'src/inspection-jobs/entities/inspection-job.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Address, InspectionJob])],
  controllers: [AddressesController],
  providers: [AddressesService],
  exports: [AddressesService],
})
export class AddressesModule {}
