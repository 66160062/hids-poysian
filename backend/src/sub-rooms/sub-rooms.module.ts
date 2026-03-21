import { Module } from '@nestjs/common';
import { SubRoomsService } from './sub-rooms.service';
import { SubRoomsController } from './sub-rooms.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubRoom } from './entities/sub-room.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SubRoom])],
  controllers: [SubRoomsController],
  providers: [SubRoomsService],
  exports: [SubRoomsService, TypeOrmModule],
})
export class SubRoomsModule {}
