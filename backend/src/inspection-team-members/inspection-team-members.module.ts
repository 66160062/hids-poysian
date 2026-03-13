import { Module } from '@nestjs/common';
import { InspectionTeamMembersService } from './inspection-team-members.service';
import { InspectionTeamMembersController } from './inspection-team-members.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InspectionTeamMember } from './entities/inspection-team-member.entity';
import { InspectionJobsModule } from 'src/inspection-jobs/inspection-jobs.module';
import { InspectorsModule } from 'src/inspectors/inspectors.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([InspectionTeamMember]),
    InspectionJobsModule,
    InspectorsModule,
  ],

  controllers: [InspectionTeamMembersController],
  providers: [InspectionTeamMembersService],
  exports: [InspectionTeamMembersService],
})
export class InspectionTeamMembersModule {}
