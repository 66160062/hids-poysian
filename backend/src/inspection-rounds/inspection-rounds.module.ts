import { Module } from '@nestjs/common';
import { InspectionRoundsService } from './inspection-rounds.service';
import { InspectionRoundsController } from './inspection-rounds.controller';

@Module({
  controllers: [InspectionRoundsController],
  providers: [InspectionRoundsService],
})
export class InspectionRoundsModule {}
