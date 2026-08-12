import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { LinkTokenGuard } from './link-token.guard';
import { JobAccessGuard } from './job-access.guard';
import { RoundAccessGuard } from './round-access.guard';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InspectionJob } from 'src/inspection-jobs/entities/inspection-job.entity';
import { InspectionRound } from 'src/inspection-rounds/entities/inspection-round.entity';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([InspectionJob, InspectionRound]),
    JwtModule.register({
      secret: 'secretKey',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, LinkTokenGuard, JobAccessGuard, RoundAccessGuard],
  exports: [
    JwtModule,
    AuthService,
    LinkTokenGuard,
    JobAccessGuard,
    RoundAccessGuard,
  ],
})
export class AuthModule {}
