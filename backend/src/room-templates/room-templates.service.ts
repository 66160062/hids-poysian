import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoomTemplate } from './entities/room-template.entity';
import { CreateRoomTemplateDto } from './dto/create-room-template.dto';
import { UpdateRoomTemplateDto } from './dto/update-room-template.dto';

@Injectable()
export class RoomTemplatesService {
  constructor(
    @InjectRepository(RoomTemplate)
    private readonly roomTemplatesRepo: Repository<RoomTemplate>,
  ) {}

  create(createRoomTemplateDto: CreateRoomTemplateDto) {
    const roomTemplate = this.roomTemplatesRepo.create(createRoomTemplateDto);
    return this.roomTemplatesRepo.save(roomTemplate);
  }

  findAll() {
    return this.roomTemplatesRepo.find();
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
