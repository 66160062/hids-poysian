import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InspectionRound } from 'src/inspection-rounds/entities/inspection-round.entity';
import { ConstructionDailyReport } from './entities/construction-daily-report.entity';
import { DailyWorkItem } from './entities/daily-work-item.entity';
import { DailyPersonnel } from './entities/daily-personnel.entity';
import { DailyIssue } from './entities/daily-issue.entity';
import { ConstructionDailyReportsController } from './construction-daily-reports.controller';
import { ConstructionDailyReportsService } from './construction-daily-reports.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ConstructionDailyReport,
      DailyWorkItem,
      DailyPersonnel,
      DailyIssue,
      InspectionRound,
    ]),
  ],
  controllers: [ConstructionDailyReportsController],
  providers: [ConstructionDailyReportsService],
})
export class ConstructionDailyReportsModule {}
