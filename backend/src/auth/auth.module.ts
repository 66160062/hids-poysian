import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
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
