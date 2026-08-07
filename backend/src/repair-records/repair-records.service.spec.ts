import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { RepairRecordsService } from './repair-records.service';
import { RepairRecord } from './entities/repair-record.entity';

describe('RepairRecordsService', () => {
  let service: RepairRecordsService;
  let repairRepo: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    merge: jest.Mock;
    softDelete: jest.Mock;
  };

  beforeEach(async () => {
    repairRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      merge: jest.fn(),
      softDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RepairRecordsService,
        { provide: getRepositoryToken(RepairRecord), useValue: repairRepo },
      ],
    }).compile();

    service = module.get<RepairRecordsService>(RepairRecordsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('nests the raw defectId/contractorId dto fields into relation objects before saving', async () => {
    repairRepo.create.mockImplementation((value) => value);
    repairRepo.save.mockImplementation((value) => value);

    const result = await service.create({
      defectId: 11,
      contractorId: 5,
      note: 'ซ่อมเสร็จแล้ว',
    } as never);

    expect(result).toMatchObject({
      defect: { defectId: 11 },
      contractor: { contractorId: 5 },
      note: 'ซ่อมเสร็จแล้ว',
    });
  });

  it('throws a Thai-language NotFoundException with the record id when missing', async () => {
    repairRepo.findOne.mockResolvedValue(null);

    await expect(service.findOne(42)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(service.findOne(42)).rejects.toThrow(
      'ไม่พบบันทึกการซ่อมรหัส #42',
    );
  });

  it('only nests relation fields on update when they are provided', async () => {
    repairRepo.findOne.mockResolvedValue({ repairId: 1, note: 'เดิม' });
    repairRepo.merge.mockImplementation((record, patch) => ({
      ...record,
      ...patch,
    }));
    repairRepo.save.mockImplementation((value) => value);

    await service.update(1, { note: 'แก้ไขแล้ว' } as never);

    expect(repairRepo.merge).toHaveBeenCalledWith(
      { repairId: 1, note: 'เดิม' },
      { note: 'แก้ไขแล้ว' },
    );
  });

  it('confirms the record exists before soft-deleting it', async () => {
    repairRepo.findOne.mockResolvedValue({ repairId: 1 });

    await service.remove(1);

    expect(repairRepo.softDelete).toHaveBeenCalledWith(1);
  });
});
