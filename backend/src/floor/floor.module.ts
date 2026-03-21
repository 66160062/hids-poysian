import { Module } from '@nestjs/common';
import { FloorService } from './floor.service';
import { FloorController } from './floor.controller';
import { Floor } from './entities/floor.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Floor])],
  controllers: [FloorController],
  providers: [FloorService],
  exports: [FloorService, TypeOrmModule],
})
export class FloorModule {}
