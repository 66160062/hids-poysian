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

  // ชั้นมาตรฐานเรียงตาม floor_order ส่วนชั้นที่ผู้ตรวจพิมพ์เอง (floor_order ว่าง) ต่อท้ายตามลำดับที่สร้าง
  findAll() {
    return this.floorRepo.find({
      order: { floorOrder: { direction: 'ASC', nulls: 'LAST' }, floorId: 'ASC' },
    });
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
