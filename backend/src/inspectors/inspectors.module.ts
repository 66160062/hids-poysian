import { Module } from '@nestjs/common';
import { InspectorsService } from './inspectors.service';
import { InspectorsController } from './inspectors.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inspector } from './entities/inspector.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Inspector])],
  controllers: [InspectorsController],
  providers: [InspectorsService],
  exports: [InspectorsService, TypeOrmModule],
})
export class InspectorsModule {}
