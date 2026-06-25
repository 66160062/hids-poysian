import { Module } from '@nestjs/common';
import { InspectionRoundsService } from './inspection-rounds.service';
import {
  InspectionRoundsController,
  ProjectApprovalController,
} from './inspection-rounds.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InspectionRound } from './entities/inspection-round.entity';
import { InspectionJobsModule } from 'src/inspection-jobs/inspection-jobs.module';
import { InspectionTeamMembersModule } from 'src/inspection-team-members/inspection-team-members.module';
import { UsersModule } from 'src/users/users.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([InspectionRound]),
    InspectionJobsModule,
    InspectionTeamMembersModule,
    UsersModule,
    AuthModule,
  ],
  controllers: [InspectionRoundsController, ProjectApprovalController],
  providers: [InspectionRoundsService],
  exports: [InspectionRoundsService, TypeOrmModule],
})
export class InspectionRoundsModule {}
