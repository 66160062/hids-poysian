import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateFloorDto } from './dto/create-floor.dto';
import { UpdateFloorDto } from './dto/update-floor.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Floor } from './entities/floor.entity';
import { Repository } from 'typeorm';

// ชั้นมาตรฐาน 10 ชั้น + ชั้นลอย (ไม่รวมแถว "ชั้นอื่นๆ" ที่ floorOrder ว่างเสมอ)
export const STANDARD_FLOORS: ReadonlyArray<{
  label: string;
  labelEn: string;
  floorOrder: number;
}> = [
  ...Array.from({ length: 10 }, (_, i) => ({
    label: `ชั้น ${i + 1}`,
    labelEn: `Floor ${i + 1}`,
    floorOrder: (i + 1) * 10,
  })),
  { label: 'ชั้นลอย', labelEn: 'Mezzanine', floorOrder: 110 },
];

@Injectable()
export class FloorService implements OnModuleInit {
  private readonly logger = new Logger(FloorService.name);

  constructor(
    @InjectRepository(Floor)
    private readonly floorRepo: Repository<Floor>,
  ) {}

  async onModuleInit() {
    try {
      await this.ensureStandardFloors();
    } catch (err) {
      this.logger.error(
        'Failed to seed standard floors',
        err instanceof Error ? err.stack : String(err),
      );
    }
  }

  // id ของชั้นต่างกันระหว่าง dev/production จึงจับคู่ด้วย label (trim) เท่านั้น
  async ensureStandardFloors(): Promise<void> {
    const existing = await this.floorRepo.find();
    const byLabel = new Map<string, Floor>();
    for (const f of existing) {
      const key = f.label.trim();
      if (!byLabel.has(key)) byLabel.set(key, f);
    }

    const toSave: Array<Partial<Floor>> = [];
    for (const std of STANDARD_FLOORS) {
      const row = byLabel.get(std.label);
      if (!row) {
        toSave.push(this.floorRepo.create(std));
        continue;
      }
      const needsOrder = row.floorOrder !== std.floorOrder;
      const needsEn = !row.labelEn;
      if (needsOrder || needsEn) {
        row.floorOrder = std.floorOrder;
        if (needsEn) row.labelEn = std.labelEn;
        toSave.push(row);
      }
    }
    if (toSave.length > 0) await this.floorRepo.save(toSave);
  }

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
    return this.floorRepo.delete({ floorId: id });
  }
}
