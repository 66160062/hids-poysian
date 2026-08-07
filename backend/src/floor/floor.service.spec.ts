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
    softDelete: jest.Mock;
  };

  beforeEach(async () => {
    floorRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOneBy: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
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

  it('soft-deletes a floor by wrapping the id in a where clause', async () => {
    await service.remove(2);

    expect(floorRepo.softDelete).toHaveBeenCalledWith({ floorId: 2 });
  });
});
