import { Module } from '@nestjs/common';
import { ContractorService } from './contractor.service';
import { ContractorController } from './contractor.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contractor } from './entities/contractor.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Contractor])],
  controllers: [ContractorController],
  providers: [ContractorService],
  exports: [ContractorService, TypeOrmModule],
})
export class ContractorModule {}
