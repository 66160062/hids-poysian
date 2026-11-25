import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HousePlan } from './entities/house-plan.entity';
import { InspectionJob } from 'src/inspection-jobs/entities/inspection-job.entity';
import { Floor } from 'src/floor/entities/floor.entity';
import { CreateHousePlanDto } from './dto/create-house-plan.dto';
import { UpdateHousePlanDto } from './dto/update-house-plan.dto';
import { StorageService } from 'src/storage/storage.service';

@Injectable()
export class HousePlansService {
  constructor(
    @InjectRepository(HousePlan)
    private readonly housePlansRepo: Repository<HousePlan>,

    @InjectRepository(InspectionJob)
    private readonly jobsRepo: Repository<InspectionJob>,

    @InjectRepository(Floor)
    private readonly floorRepo: Repository<Floor>,

    private readonly storageService: StorageService,
  ) {}

  async findByJob(jobId: number): Promise<HousePlan[]> {
    return this.housePlansRepo.find({
      where: { job: { jobId } },
      order: {
        floor: { floorOrder: { direction: 'ASC', nulls: 'LAST' } },
        orderIndex: 'ASC',
        createdAt: 'ASC',
      },
      relations: ['floor'],
    });
  }

  async findOne(planId: number): Promise<HousePlan> {
    const plan = await this.housePlansRepo.findOne({
      where: { planId },
      relations: ['floor', 'job'],
    });
    if (!plan) {
      throw new NotFoundException(`ไม่พบข้อมูลแปลน (ID: ${planId})`);
    }
    return plan;
  }

  planNamesFor(floor: Floor): { name: string; nameEn: string | null } {
    const label = floor.label.trim();
    const labelEn = floor.labelEn?.trim();
    return {
      name: `แปลน${label}`,
      nameEn: labelEn ? `${labelEn} Plan` : null,
    };
  }

  // หนึ่งงานตรวจมีได้หนึ่งแปลนต่อชั้น (ไม่มี unique index ใน DB เพราะ production ปิด synchronize)
  private async assertFloorFree(
    jobId: number,
    floorId: number,
    excludePlanId?: number,
  ): Promise<void> {
    const existing = await this.housePlansRepo.findOne({
      where: { job: { jobId }, floor: { floorId } },
    });
    if (existing && existing.planId !== excludePlanId) {
      throw new ConflictException('ชั้นนี้มีแปลนแล้ว');
    }
  }

  async create(
    jobId: number,
    file: Express.Multer.File | undefined,
    dto: CreateHousePlanDto,
  ): Promise<HousePlan> {
    if (!file) {
      throw new BadRequestException('กรุณาอัปโหลดรูปภาพแปลน');
    }

    const job = await this.jobsRepo.findOneBy({ jobId });
    if (!job) {
      throw new NotFoundException(`ไม่พบข้อมูลงานตรวจ (ID: ${jobId})`);
    }

    const floor = await this.floorRepo.findOneBy({ floorId: dto.floorId });
    if (!floor) {
      throw new NotFoundException(`ไม่พบข้อมูลชั้น (ID: ${dto.floorId})`);
    }
    await this.assertFloorFree(jobId, floor.floorId);

    const imageUrl = await this.storageService.uploadImage(
      file.buffer,
      'house-plans',
    );

    const plan = this.housePlansRepo.create({
      ...this.planNamesFor(floor),
      imageUrl,
      orderIndex: dto.orderIndex ?? 0,
      job,
      floor,
    });

    return this.housePlansRepo.save(plan);
  }

  async update(planId: number, dto: UpdateHousePlanDto): Promise<HousePlan> {
    const plan = await this.findOne(planId);
    if (dto.floorId !== undefined) {
      const floor = await this.floorRepo.findOneBy({ floorId: dto.floorId });
      if (!floor) {
        throw new NotFoundException(`ไม่พบข้อมูลชั้น (ID: ${dto.floorId})`);
      }
      await this.assertFloorFree(plan.job.jobId, floor.floorId, planId);
      plan.floor = floor;
      Object.assign(plan, this.planNamesFor(floor));
    } else {
      if (dto.name !== undefined) plan.name = dto.name;
      if (dto.nameEn !== undefined) plan.nameEn = dto.nameEn;
    }
    return this.housePlansRepo.save(plan);
  }

  async remove(planId: number): Promise<HousePlan> {
    const plan = await this.findOne(planId);
    if (plan.imageUrl) {
      await this.storageService.deleteFile(plan.imageUrl);
    }
    return this.housePlansRepo.remove(plan);
  }
}
