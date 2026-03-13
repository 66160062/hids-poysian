import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RepairRecord } from './entities/repair-record.entity';

@Injectable()
export class RepairRecordsService {
  constructor(
    @InjectRepository(RepairRecord)
    private readonly repairRepository: Repository<RepairRecord>,
  ) {}

  async create(data: any): Promise<RepairRecord> {
    // แยกความสัมพันธ์ (Relations) ออกมาจัดการ
    const { defectId, contractorId, ...rest } = data;

    const newRecord = this.repairRepository.create({
      ...rest,
      repairedAt: new Date(),
      defect: { id: defectId } as any,
      contractor: { id: contractorId } as any,
    });

    return await this.repairRepository.save(newRecord);
  }

  async findAll(): Promise<RepairRecord[]> {
    return await this.repairRepository.find({
      relations: ['defect', 'contractor'],
    });
  }

  async findOne(id: number): Promise<RepairRecord> {
    const record = await this.repairRepository.findOne({
      where: { repairId: id },
      relations: ['defect', 'contractor'],
    });
    if (!record) throw new NotFoundException(`Repair record #${id} not found`);
    return record;
  }

  async update(id: number, data: any): Promise<RepairRecord> {
    const record = await this.findOne(id);
    
    const { defectId, contractorId, ...rest } = data;

    // รวมร่างข้อมูลเดิมกับข้อมูลใหม่
    const updatedRecord = this.repairRepository.merge(record, {
      ...rest,
      // อัปเดตความสัมพันธ์ถ้ามีการส่ง ID มาใหม่
      defect: defectId ? ({ id: defectId } as any) : record.defect,
      contractor: contractorId ? ({ id: contractorId } as any) : record.contractor,
    });

    return await this.repairRepository.save(updatedRecord);
  }

  async remove(id: number): Promise<void> {
    const record = await this.findOne(id);
    await this.repairRepository.softRemove(record);
  }
}