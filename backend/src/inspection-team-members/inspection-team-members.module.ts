import { Module } from '@nestjs/common';
import { InspectionTeamMembersService } from './inspection-team-members.service';
import { InspectionTeamMembersController } from './inspection-team-members.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InspectionTeamMember } from './entities/inspection-team-member.entity';
import { InspectionJobsModule } from 'src/inspection-jobs/inspection-jobs.module';
import { UsersModule } from 'src/users/users.module';
import { InspectionJob } from 'src/inspection-jobs/entities/inspection-job.entity';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([InspectionTeamMember, InspectionJob, User]),
    InspectionJobsModule,
    UsersModule,
  ],

  controllers: [InspectionTeamMembersController],
  providers: [InspectionTeamMembersService],
  exports: [InspectionTeamMembersService, InspectionTeamMembersModule],
})
export class InspectionTeamMembersModule {}
