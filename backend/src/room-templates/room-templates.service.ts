import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { RoomTemplate } from './entities/room-template.entity';
import { CreateRoomTemplateDto } from './dto/create-room-template.dto';
import { UpdateRoomTemplateDto } from './dto/update-room-template.dto';
import { Floor } from 'src/floor/entities/floor.entity';
import { SubRoom } from 'src/sub-rooms/entities/sub-room.entity';
import { Room } from 'src/rooms/entities/room.entity';

@Injectable()
export class RoomTemplatesService {
  constructor(
    @InjectRepository(RoomTemplate)
    private readonly roomTemplatesRepo: Repository<RoomTemplate>,
  ) {}

  async create(createRoomTemplateDto: CreateRoomTemplateDto) {
    const { roomId, subRoomId, floorId, ...rest } = createRoomTemplateDto;
    const roomTemplate = this.roomTemplatesRepo.create({
      ...rest,
      room: { roomId } as Room,
      floor: { floorId } as Floor,
      ...(subRoomId && { subRoom: { subRoomId } as SubRoom }),
    });

    return await this.roomTemplatesRepo.save(roomTemplate);
  }

  findAll() {
    return this.roomTemplatesRepo.find({
      relations: ['room', 'subRoom', 'floor'],
    });
  }

  findOne(id: number) {
    return this.roomTemplatesRepo.findOneOrFail({
      where: { templateId: id },
      relations: ['room', 'subRoom', 'floor'],
    });
  }

  async update(id: number, updateRoomTemplateDto: UpdateRoomTemplateDto) {
    const roomTemplate = await this.findOne(id);
    const { roomId, subRoomId, floorId, ...rest } = updateRoomTemplateDto;

    Object.assign(roomTemplate, {
      ...rest,
      ...(roomId && { room: { roomId } as Room }),
      ...(subRoomId && { subRoom: { subRoomId } as SubRoom }),
      ...(floorId && { floor: { floorId } as Floor }),
    });

    return this.roomTemplatesRepo.save(roomTemplate);
  }

  async remove(id: number) {
    const roomTemplate = await this.findOne(id);
    return this.roomTemplatesRepo.remove(roomTemplate);
  }

  async lookup(roomId: number, floorId: number, subRoomId: number | null) {
    const template = await this.roomTemplatesRepo.findOne({
      where: {
        room: { roomId },
        floor: { floorId },
        ...(subRoomId ? { subRoom: { subRoomId } } : { subRoom: IsNull() }),
      },
      relations: ['room', 'floor', 'subRoom'],
    });
    return template ?? null;
  }
}
