import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { InspectionJob } from 'src/inspection-jobs/entities/inspection-job.entity';
import { Rating } from './entities/rating.entity';
import { RatingsController } from './ratings.controller';
import { RatingsService } from './ratings.service';

@Module({
  imports: [TypeOrmModule.forFeature([Rating, InspectionJob]), AuthModule],
  controllers: [RatingsController],
  providers: [RatingsService],
})
export class RatingsModule {}
