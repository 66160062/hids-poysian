import { Module } from '@nestjs/common';
import { ContractorService } from './contractor.service';
import { ContractorController } from './contractor.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contractor } from './entities/contractor.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Contractor]), AuthModule],
  controllers: [ContractorController],
  providers: [ContractorService],
  exports: [ContractorService, TypeOrmModule],
})
export class ContractorModule {}
