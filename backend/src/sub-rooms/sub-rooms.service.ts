import { Injectable } from '@nestjs/common';
import { CreateSubRoomDto } from './dto/create-sub-room.dto';
import { UpdateSubRoomDto } from './dto/update-sub-room.dto';
import { Repository } from 'typeorm';
import { SubRoom } from './entities/sub-room.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class SubRoomsService {
  constructor(
    @InjectRepository(SubRoom)
    private readonly subRoomsRepo: Repository<SubRoom>,
  ) {}
  create(createSubRoomDto: CreateSubRoomDto) {
    const subRoom = this.subRoomsRepo.create(createSubRoomDto);
    return this.subRoomsRepo.save(subRoom);
  }

  findAll() {
    return this.subRoomsRepo.find();
  }

  findOne(id: number) {
    return this.subRoomsRepo.findOneBy({ subRoomId: id });
  }

  update(id: number, updateSubRoomDto: UpdateSubRoomDto) {
    return this.subRoomsRepo.update(id, updateSubRoomDto);
  }

  remove(id: number) {
    return this.subRoomsRepo.softDelete({ subRoomId: id });
  }
}
