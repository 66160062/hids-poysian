import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRepairRecordDto } from './dto/create-repair-record.dto';
import { UpdateRepairRecordDto } from './dto/update-repair-record.dto';
import { RepairRecord } from './entities/repair-record.entity';

@Injectable()
export class RepairRecordsService {
  constructor(
    @InjectRepository(RepairRecord)
    private readonly repairRepository: Repository<RepairRecord>,
  ) {}

  async create(createDto: CreateRepairRecordDto): Promise<RepairRecord> {
    const { defectId, contractorId, ...rest } = createDto;
    const repairData = {
      ...rest,
      repairedAt: new Date(),
      defect: { defectId: defectId },
      contractor: { contractorId: contractorId },
    };
    const newRecord = this.repairRepository.create(repairData);
    return await this.repairRepository.save(newRecord);
  }

  async findAll(): Promise<RepairRecord[]> {
    return await this.repairRepository.find({
      relations: {
        defect: true,
        contractor: true,
      },
    });
  }

  async findOne(id: number): Promise<RepairRecord> {
    const record = await this.repairRepository.findOne({
      where: { repairId: id },
      relations: {
        defect: true,
        contractor: true,
      },
    });

    if (!record) {
      throw new NotFoundException(`ไม่พบบันทึกการซ่อมรหัส #${id}`);
    }
    return record;
  }

  async update(
    id: number,
    updateDto: UpdateRepairRecordDto,
  ): Promise<RepairRecord> {
    const record = await this.findOne(id);
    const { defectId, contractorId, ...rest } = updateDto;
    const updatedRecord = this.repairRepository.merge(record, {
      ...rest,
      ...(defectId && { defect: { defectId: defectId } }),
      ...(contractorId && { contractor: { contractorId: contractorId } }),
    });

    return await this.repairRepository.save(updatedRecord);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.repairRepository.softDelete(id);
  }
}
