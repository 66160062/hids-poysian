import { Module } from '@nestjs/common';
import { InspectionRoundsService } from './inspection-rounds.service';
import { InspectionRoundsController } from './inspection-rounds.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InspectionRound } from './entities/inspection-round.entity';
import { InspectionJobsModule } from 'src/inspection-jobs/inspection-jobs.module';
import { InspectionTeamMembersModule } from 'src/inspection-team-members/inspection-team-members.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([InspectionRound]),
    InspectionJobsModule,
    InspectionTeamMembersModule,
  ],
  controllers: [InspectionRoundsController],
  providers: [InspectionRoundsService],
  exports: [InspectionRoundsService, TypeOrmModule],
})
export class InspectionRoundsModule {}
