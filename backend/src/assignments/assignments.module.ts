import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Assignment } from './entities/assignment.entity';
import { InspectionRound } from 'src/inspection-rounds/entities/inspection-round.entity';
import { AssignmentsService } from './assignments.service';
import { AssignmentsController } from './assignments.controller';
import { InspectionJobsModule } from 'src/inspection-jobs/inspection-jobs.module';
import { UsersModule } from 'src/users/users.module';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Assignment, InspectionRound]),
    InspectionJobsModule,
    UsersModule,
    NotificationsModule,
  ],
  controllers: [AssignmentsController],
  providers: [AssignmentsService],
  exports: [AssignmentsService, TypeOrmModule],
})
export class AssignmentsModule {}
