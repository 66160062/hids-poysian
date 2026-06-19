import { Module } from '@nestjs/common';
import { InspectionTeamMembersService } from './inspection-team-members.service';
import { InspectionTeamMembersController } from './inspection-team-members.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InspectionTeamMember } from './entities/inspection-team-member.entity';
import { InspectionJobsModule } from 'src/inspection-jobs/inspection-jobs.module';
import { UsersModule } from 'src/users/users.module';
import { InspectionRound } from 'src/inspection-rounds/entities/inspection-round.entity';
import { Team } from 'src/teams/entities/team.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([InspectionTeamMember, InspectionRound, Team]),
    InspectionJobsModule,
    UsersModule,
  ],

  controllers: [InspectionTeamMembersController],
  providers: [InspectionTeamMembersService],
  exports: [InspectionTeamMembersService, TypeOrmModule],
})
export class InspectionTeamMembersModule {}
