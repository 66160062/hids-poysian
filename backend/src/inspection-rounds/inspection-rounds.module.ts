import { Module } from '@nestjs/common';
import { InspectionRoundsService } from './inspection-rounds.service';
import { InspectionRoundsController } from './inspection-rounds.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InspectionRound } from './entities/inspection-round.entity';
import { InspectionJob } from 'src/inspection-jobs/entities/inspection-job.entity';
import { InspectionTeamMember } from 'src/inspection-team-members/entities/inspection-team-member.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InspectionRound,
      InspectionJob,
      InspectionTeamMember,
    ]),
  ],
  controllers: [InspectionRoundsController],
  providers: [InspectionRoundsService],
  exports: [InspectionRoundsService, InspectionRoundsModule],
})
export class InspectionRoundsModule {}
