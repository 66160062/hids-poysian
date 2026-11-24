import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FloorService, STANDARD_FLOORS } from './floor.service';
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
      create: jest.fn((v) => v),
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

  it('deletes a floor by wrapping the id in a where clause', async () => {
    await service.remove(2);

    expect(floorRepo.delete).toHaveBeenCalledWith({ floorId: 2 });
  });

  describe('ensureStandardFloors', () => {
    const savedRows = () =>
      floorRepo.save.mock.calls.flatMap(([rows]) => rows as Floor[]);

    it('creates the missing standard floors with order and English label', async () => {
      floorRepo.find.mockResolvedValue([
        { floorId: 1, label: 'ชั้น 1', labelEn: 'Floor 1', floorOrder: null },
      ]);
      await service.ensureStandardFloors();
      const created = savedRows();
      expect(created).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ label: 'ชั้น 10', labelEn: 'Floor 10', floorOrder: 100 }),
          expect.objectContaining({ label: 'ชั้นลอย', labelEn: 'Mezzanine', floorOrder: 110 }),
        ]),
      );
      expect(created.filter((f) => f.label === 'ชั้น 1')).toHaveLength(1); // updated, not duplicated
    });

    it('reuses existing rows by trimmed label and only fills floorOrder / missing labelEn', async () => {
      floorRepo.find.mockResolvedValue([
        { floorId: 4, label: ' ชั้น 2 ', labelEn: null, floorOrder: null },
      ]);
      await service.ensureStandardFloors();
      expect(savedRows()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ floorId: 4, floorOrder: 20, labelEn: 'Floor 2' }),
        ]),
      );
      expect(savedRows().filter((f) => f.label.trim() === 'ชั้น 2')).toHaveLength(1);
    });

    it('never touches the "other" row or inspector-typed floors', async () => {
      floorRepo.find.mockResolvedValue([
        { floorId: 7, label: 'ชั้นอื่นๆ…..', labelEn: 'Other Floor…', floorOrder: null },
        { floorId: 30, label: 'ชั้นดาดฟ้า', labelEn: null, floorOrder: null },
      ]);
      await service.ensureStandardFloors();
      expect(savedRows().find((f) => f.floorId === 7 || f.floorId === 30)).toBeUndefined();
    });

    it('saves nothing when every standard floor is already correct', async () => {
      floorRepo.find.mockResolvedValue(
        STANDARD_FLOORS.map((f, i) => ({ floorId: i + 1, ...f })),
      );
      await service.ensureStandardFloors();
      expect(floorRepo.save).not.toHaveBeenCalled();
    });

    it('defines 10 numbered floors plus mezzanine, none containing "อื่น"', () => {
      expect(STANDARD_FLOORS).toHaveLength(11);
      expect(STANDARD_FLOORS[0]).toEqual({ label: 'ชั้น 1', labelEn: 'Floor 1', floorOrder: 10 });
      expect(STANDARD_FLOORS[10]).toEqual({ label: 'ชั้นลอย', labelEn: 'Mezzanine', floorOrder: 110 });
      expect(STANDARD_FLOORS.some((f) => f.label.includes('อื่น'))).toBe(false);
    });

    it('onModuleInit swallows seeding errors so boot never fails', async () => {
      const logSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
      floorRepo.find.mockRejectedValue(new Error('db down'));
      await expect(service.onModuleInit()).resolves.toBeUndefined();
      expect(logSpy).toHaveBeenCalled();
      logSpy.mockRestore();
    });
  });
});
