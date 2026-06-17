import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Address } from 'src/addresses/entities/address.entity';
import { Customer } from 'src/customers/entities/customer.entity';
import { HouseType } from 'src/house-types/entities/house-type.entity';
import { InspectionJob } from 'src/inspection-jobs/entities/inspection-job.entity';
import { InspectionRound } from 'src/inspection-rounds/entities/inspection-round.entity';
import { InspectionSummaryItem } from 'src/inspection-summary-items/entities/inspection-summary-item.entity';
import { InspectionTeamMember } from 'src/inspection-team-members/entities/inspection-team-member.entity';
import { User } from 'src/users/entities/user.entity';
import { DailyReportsController } from './daily-reports.controller';
import { DailyReportsService } from './daily-reports.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Customer,
      Address,
      HouseType,
      User,
      InspectionJob,
      InspectionTeamMember,
      InspectionRound,
      InspectionSummaryItem,
    ]),
  ],
  controllers: [DailyReportsController],
  providers: [DailyReportsService],
})
export class DailyReportsModule {}
