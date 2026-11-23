import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
    return this.floorRepo.find({
      order: { floorOrder: 'ASC', floorId: 'ASC' },
    });
  }

  findOne(id: number) {
    return this.floorRepo.findOneBy({ floorId: id });
  }

  async update(id: number, updateFloorDto: UpdateFloorDto): Promise<Floor> {
    const floor = await this.findOne(id);
    if (!floor) {
      throw new NotFoundException(`Floor #${id} not found`);
    }
    Object.assign(floor, updateFloorDto);
    return this.floorRepo.save(floor);
  }

  async remove(id: number) {
    try {
      const res = await this.floorRepo.delete({ floorId: id });
      if (res.affected === 0) {
        throw new NotFoundException(`Floor #${id} not found`);
      }
      return res;
    } catch (error: unknown) {
      const err = error as { code?: string };
      if (err?.code === '23503') {
        throw new BadRequestException(
          'ไม่สามารถลบชั้นนี้ได้เนื่องจากมีรายการจุดบกพร่อง (Defect) ใช้งานอยู่',
        );
      }
      throw error;
    }
  }
}
