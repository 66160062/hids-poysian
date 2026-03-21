import { Module } from '@nestjs/common';
import { RoomTemplatesService } from './room-templates.service';
import { RoomTemplatesController } from './room-templates.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomTemplate } from './entities/room-template.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RoomTemplate])],
  controllers: [RoomTemplatesController],
  providers: [RoomTemplatesService],
  exports: [RoomTemplatesService, TypeOrmModule],
})
export class RoomTemplatesModule {}
