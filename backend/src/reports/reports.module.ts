import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InspectionRound } from 'src/inspection-rounds/entities/inspection-round.entity';
import { Defect } from 'src/defects/entities/defect.entity';
import { InspectionSummaryItem } from 'src/inspection-summary-items/entities/inspection-summary-item.entity';
import { AuthModule } from 'src/auth/auth.module';
import { ReportsService } from './reports.service';

@Global()
@Module({
  imports: [
    // InspectionSummaryItem อยู่ในนี้ด้วยเพราะแบบสรุปการตรวจถูกนับเข้า hash ของรายงาน (ดู computeDataHash)
    TypeOrmModule.forFeature([InspectionRound, Defect, InspectionSummaryItem]),
    AuthModule,
  ],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
