import { Injectable } from '@nestjs/common';
import { CreateFloorDto } from './dto/create-floor.dto';
import { UpdateFloorDto } from './dto/update-floor.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Floor } from './entities/floor.entity';
import { Repository } from 'typeorm';

@Injectable()
export class FloorService {
  constructor(
    @InjectRepository(Floor)
    private readonly floorRepo: Repository<Floor>,
  ) {}
  create(createFloorDto: CreateFloorDto) {
    const floor = this.floorRepo.create(createFloorDto);
    return this.floorRepo.save(floor);
  }

  findAll() {
    return this.floorRepo.find();
  }

  findOne(id: number) {
    return this.floorRepo.findOneBy({ floorId: id });
  }

  update(id: number, updateFloorDto: UpdateFloorDto) {
    return this.floorRepo.update({ floorId: id }, updateFloorDto);
  }

  remove(id: number) {
    return this.floorRepo.softDelete({ floorId: id });
  }
}
