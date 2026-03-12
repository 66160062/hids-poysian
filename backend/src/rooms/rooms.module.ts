import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';

import { Room } from './entities/room.entity';
import { Category } from '../categories/entities/category.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Room, Category]),
    JwtModule
  ],
  controllers: [RoomsController],
  providers: [RoomsService],
})
export class RoomsModule { }