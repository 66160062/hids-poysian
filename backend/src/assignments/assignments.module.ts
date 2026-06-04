import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Assignment } from './entities/assignment.entity';
import { AssignmentsService } from './assignments.service';
import { AssignmentsController } from './assignments.controller';
import { InspectionJobsModule } from 'src/inspection-jobs/inspection-jobs.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Assignment]),
    InspectionJobsModule,
    UsersModule,
  ],
  controllers: [AssignmentsController],
  providers: [AssignmentsService],
  exports: [AssignmentsService, TypeOrmModule],
})
export class AssignmentsModule {}
