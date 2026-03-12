import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from './entities/room.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { Category } from '../categories/entities/category.entity';

@Injectable()
export class RoomsService {

  constructor(
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,

    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
  ) { }

  // CREATE
  async create(createRoomDto: CreateRoomDto) {

    const category = await this.categoriesRepository.findOne({
      where: { id: createRoomDto.categoryId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const room = this.roomRepository.create({
      roomNumber: createRoomDto.roomNumber,
      roomType: createRoomDto.roomType,
      floor: createRoomDto.floor,
      status: createRoomDto.status,
      category: category,
    });

    return this.roomRepository.save(room);
  }

  // READ ALL
  findAll() {

    return this.roomRepository.find();

  }

  // READ ONE
  async findOne(id: number) {

    const room = await this.roomRepository.findOne({
      where: { id }
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    return room;

  }

  // UPDATE
  async update(id: number, updateRoomDto: UpdateRoomDto) {

    const room = await this.findOne(id);

    Object.assign(room, updateRoomDto);

    return this.roomRepository.save(room);

  }

  // DELETE
  async remove(id: number) {

    const room = await this.findOne(id);

    return this.roomRepository.remove(room);

  }

}