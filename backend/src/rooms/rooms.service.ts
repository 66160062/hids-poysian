import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { Room } from './entities/room.entity';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room)
    private readonly roomsRepo: Repository<Room>,
  ) {}

  create(dto: CreateRoomDto): Promise<Room> {
    const room = this.roomsRepo.create(dto);
    return this.roomsRepo.save(room);
  }

  findAll(): Promise<Room[]> {
    return this.roomsRepo.find({ order: { roomId: 'ASC' } });
  }

  async findOne(id: number): Promise<Room> {
    const room = await this.roomsRepo.findOneByOrFail({ roomId: id });
    return room;
  }

  async update(id: number, dto: UpdateRoomDto): Promise<Room> {
    const room = await this.findOne(id);
    Object.assign(room, dto);
    return this.roomsRepo.save(room);
  }

  async remove(id: number): Promise<void> {
    const room = await this.findOne(id);
    await this.roomsRepo.remove(room);
  }
}
