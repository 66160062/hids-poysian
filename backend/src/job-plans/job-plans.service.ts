import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobPlan } from './entities/job-plan.entity';
import { InspectionJob } from 'src/inspection-jobs/entities/inspection-job.entity';
import { Floor } from 'src/floor/entities/floor.entity';
import { CreateJobPlanDto } from './dto/create-job-plan.dto';
import { StorageService } from 'src/storage/storage.service';

@Injectable()
export class JobPlansService {
  constructor(
    @InjectRepository(JobPlan)
    private readonly jobPlansRepo: Repository<JobPlan>,

    @InjectRepository(InspectionJob)
    private readonly jobsRepo: Repository<InspectionJob>,

    @InjectRepository(Floor)
    private readonly floorRepo: Repository<Floor>,

    private readonly storageService: StorageService,
  ) {}

  async findByJob(jobId: number): Promise<JobPlan[]> {
    return this.jobPlansRepo.find({
      where: { job: { jobId } },
      order: {
        orderIndex: 'ASC',
        createdAt: 'ASC',
      },
      relations: ['floor'],
    });
  }

  async findOne(planId: number): Promise<JobPlan> {
    const plan = await this.jobPlansRepo.findOne({
      where: { planId },
      relations: ['floor', 'job'],
    });
    if (!plan) {
      throw new NotFoundException(`ไม่พบข้อมูลแปลน (ID: ${planId})`);
    }
    return plan;
  }

  async create(
    jobId: number,
    file: Express.Multer.File | undefined,
    dto: CreateJobPlanDto,
  ): Promise<JobPlan> {
    if (!file) {
      throw new BadRequestException('กรุณาอัปโหลดรูปภาพแปลน');
    }

    const job = await this.jobsRepo.findOneBy({ jobId });
    if (!job) {
      throw new NotFoundException(`ไม่พบข้อมูลงานตรวจ (ID: ${jobId})`);
    }

    let floor: Floor | null = null;
    if (dto.floorId) {
      floor = await this.floorRepo.findOneBy({ floorId: dto.floorId });
      if (!floor) {
        throw new NotFoundException(`ไม่พบข้อมูลชั้น (ID: ${dto.floorId})`);
      }
    }

    const imageUrl = await this.storageService.uploadImage(
      file.buffer,
      'job-plans',
    );

    const plan = this.jobPlansRepo.create({
      name: dto.name,
      imageUrl,
      orderIndex: dto.orderIndex ?? 0,
      job,
      floor,
    });

    return this.jobPlansRepo.save(plan);
  }

  async remove(planId: number): Promise<JobPlan> {
    const plan = await this.findOne(planId);
    if (plan.imageUrl) {
      await this.storageService.deleteFile(plan.imageUrl);
    }
    return this.jobPlansRepo.remove(plan);
  }
}
