import { Module } from '@nestjs/common';
import { InspectionTeamMembersService } from './inspection-team-members.service';
import { InspectionTeamMembersController } from './inspection-team-members.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InspectionTeamMember } from './entities/inspection-team-member.entity';
import { InspectionJobsModule } from 'src/inspection-jobs/inspection-jobs.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([InspectionTeamMember]),
    InspectionJobsModule,
    UsersModule,
    InspectionJobsModule,
    UsersModule,
  ],

  controllers: [InspectionTeamMembersController],
  providers: [InspectionTeamMembersService],
  exports: [InspectionTeamMembersService, TypeOrmModule],
})
export class InspectionTeamMembersModule {}
