import { Module } from '@nestjs/common';
import { RoomTemplatesService } from './room-templates.service';
import { RoomTemplatesController } from './room-templates.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomTemplate } from './entities/room-template.entity';
import { Floor } from 'src/floor/entities/floor.entity';
import { SubRoom } from 'src/sub-rooms/entities/sub-room.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RoomTemplate,Floor,SubRoom])],
  controllers: [RoomTemplatesController],
  providers: [RoomTemplatesService],
  exports: [RoomTemplatesService, TypeOrmModule],
})
export class RoomTemplatesModule {}
