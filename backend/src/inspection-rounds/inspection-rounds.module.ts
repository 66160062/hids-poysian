import { Module } from '@nestjs/common';
import { InspectionRoundsService } from './inspection-rounds.service';
import {
  InspectionRoundsController,
  ProjectApprovalController,
} from './inspection-rounds.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InspectionRound } from './entities/inspection-round.entity';
import { Defect } from 'src/defects/entities/defect.entity';
import { InspectionJobsModule } from 'src/inspection-jobs/inspection-jobs.module';
import { InspectionTeamMembersModule } from 'src/inspection-team-members/inspection-team-members.module';
import { UsersModule } from 'src/users/users.module';
import { AuthModule } from 'src/auth/auth.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { MailModule } from 'src/mail/mail.module';
import { PdfModule } from 'src/pdf/pdf.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([InspectionRound, Defect]),
    InspectionJobsModule,
    InspectionTeamMembersModule,
    UsersModule,
    AuthModule,
    NotificationsModule,
    MailModule,
    PdfModule,
  ],
  controllers: [InspectionRoundsController, ProjectApprovalController],
  providers: [InspectionRoundsService],
  exports: [InspectionRoundsService, TypeOrmModule],
})
export class InspectionRoundsModule {}
