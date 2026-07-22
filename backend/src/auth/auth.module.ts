import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { LinkTokenGuard } from './link-token.guard';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InspectionJob } from 'src/inspection-jobs/entities/inspection-job.entity';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([InspectionJob]),
    JwtModule.register({
      secret: 'secretKey',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, LinkTokenGuard],
  exports: [JwtModule, AuthService, LinkTokenGuard],
})
export class AuthModule {}
