import { Module } from '@nestjs/common';
import { InpectorsService } from './inpectors.service';
import { InpectorsController } from './inpectors.controller';

@Module({
  controllers: [InpectorsController],
  providers: [InpectorsService],
})
export class InpectorsModule {}
