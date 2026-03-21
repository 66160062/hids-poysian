import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoomTemplate } from './entities/room-template.entity';
import { CreateRoomTemplateDto } from './dto/create-room-template.dto';
import { UpdateRoomTemplateDto } from './dto/update-room-template.dto';
import { Floor } from 'src/floor/entities/floor.entity';
import { SubRoom } from 'src/sub-rooms/entities/sub-room.entity';

@Injectable()
export class RoomTemplatesService {
  constructor(
    @InjectRepository(RoomTemplate)
    private readonly roomTemplatesRepo: Repository<RoomTemplate>,
    @InjectRepository(Floor)
    private readonly floorsRepo: Repository<Floor>,
    @InjectRepository(SubRoom)
    private readonly subRoomsRepo: Repository<SubRoom>,
  ) {}

  async create(createRoomTemplateDto: CreateRoomTemplateDto) {
    const { floorId, ...rest } = createRoomTemplateDto;
    const roomTemplate = this.roomTemplatesRepo.create({
      ...rest,
      floor: { floorId } as Floor,
    });

    return await this.roomTemplatesRepo.save(roomTemplate);
  }

  async findAll() {
    return this.roomTemplatesRepo.find({
      relations: ['floor', 'subRoom'],
    });
  }

  findOne(id: number) {
    return this.roomTemplatesRepo.findOneByOrFail({ templateId: id });
  }

  async update(id: number, updateRoomTemplateDto: UpdateRoomTemplateDto) {
    const roomTemplate = await this.findOne(id);
    Object.assign(roomTemplate, updateRoomTemplateDto);
    return this.roomTemplatesRepo.save(roomTemplate);
  }

  async remove(id: number) {
    const roomTemplate = await this.findOne(id);
    return this.roomTemplatesRepo.remove(roomTemplate);
  }
}
