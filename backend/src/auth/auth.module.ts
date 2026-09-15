import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LinkTokenGuard } from './link-token.guard';
import { JobAccessGuard } from './job-access.guard';
import { RoundAccessGuard } from './round-access.guard';
import { InspectorSelfOrAdminGuard } from './inspector-self-or-admin.guard';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InspectionJob } from 'src/inspection-jobs/entities/inspection-job.entity';
import { InspectionRound } from 'src/inspection-rounds/entities/inspection-round.entity';
import { Assignment } from 'src/assignments/entities/assignment.entity';
import { InspectionTeamMember } from 'src/inspection-team-members/entities/inspection-team-member.entity';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([
      InspectionJob,
      InspectionRound,
      Assignment,
      InspectionTeamMember,
      User,
    ]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error(
            'JWT_SECRET is not set. Add it to backend/.env before starting the server.',
          );
        }
        return {
          secret,
          signOptions: { expiresIn: '8h' },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LinkTokenGuard,
    JobAccessGuard,
    RoundAccessGuard,
    InspectorSelfOrAdminGuard,
  ],
  exports: [
    JwtModule,
    AuthService,
    LinkTokenGuard,
    JobAccessGuard,
    RoundAccessGuard,
    InspectorSelfOrAdminGuard,
  ],
})
export class AuthModule {}
