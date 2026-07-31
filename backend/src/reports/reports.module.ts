import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InspectionRound } from 'src/inspection-rounds/entities/inspection-round.entity';
import { Defect } from 'src/defects/entities/defect.entity';
import { AuthModule } from 'src/auth/auth.module';
import { ReportsService } from './reports.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([InspectionRound, Defect]), AuthModule],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
