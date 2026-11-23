import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FloorService } from './floor.service';
import { Floor } from './entities/floor.entity';

describe('FloorService', () => {
  let service: FloorService;
  let floorRepo: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOneBy: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(async () => {
    floorRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOneBy: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FloorService,
        { provide: getRepositoryToken(Floor), useValue: floorRepo },
      ],
    }).compile();

    service = module.get<FloorService>(FloorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns null rather than throwing when a floor is missing', async () => {
    floorRepo.findOneBy.mockResolvedValue(null);

    await expect(service.findOne(99)).resolves.toBeNull();
    expect(floorRepo.findOneBy).toHaveBeenCalledWith({ floorId: 99 });
  });

  it('updates a floor when found', async () => {
    const mockFloor = {
      floorId: 1,
      label: 'ชั้น 1',
      labelEn: 'Floor 1',
      floorOrder: 1,
    };
    floorRepo.findOneBy.mockResolvedValue(mockFloor);
    floorRepo.save.mockImplementation(
      (f: Floor): Promise<Floor> => Promise.resolve(f),
    );

    const result = await service.update(1, { label: 'ชั้น 1 แก้ไข' });
    expect(result.label).toBe('ชั้น 1 แก้ไข');
    expect(floorRepo.save).toHaveBeenCalled();
  });

  it('throws NotFoundException when updating non-existent floor', async () => {
    floorRepo.findOneBy.mockResolvedValue(null);

    await expect(service.update(999, { label: 'ชั้น 999' })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('deletes a floor by id', async () => {
    floorRepo.delete.mockResolvedValue({ affected: 1, raw: [] });

    await service.remove(2);

    expect(floorRepo.delete).toHaveBeenCalledWith({ floorId: 2 });
  });

  it('throws NotFoundException when deleting non-existent floor', async () => {
    floorRepo.delete.mockResolvedValue({ affected: 0, raw: [] });

    await expect(service.remove(999)).rejects.toThrow(NotFoundException);
  });

  it('throws BadRequestException when deleting a floor with foreign key constraint', async () => {
    floorRepo.delete.mockRejectedValue({ code: '23503' });

    await expect(service.remove(1)).rejects.toThrow(BadRequestException);
  });
});
