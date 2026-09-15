import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HousePlansService } from './house-plans.service';
import { HousePlan } from './entities/house-plan.entity';
import { InspectionJob } from 'src/inspection-jobs/entities/inspection-job.entity';
import { Floor } from 'src/floor/entities/floor.entity';
import { StorageService } from 'src/storage/storage.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('HousePlansService', () => {
  let service: HousePlansService;
  let housePlansRepo: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
  };
  let jobsRepo: {
    findOneBy: jest.Mock;
  };
  let floorRepo: {
    findOneBy: jest.Mock;
  };
  let storageService: {
    uploadImage: jest.Mock;
    deleteFile: jest.Mock;
  };

  beforeEach(async () => {
    housePlansRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };
    jobsRepo = {
      findOneBy: jest.fn(),
    };
    floorRepo = {
      findOneBy: jest.fn(),
    };
    storageService = {
      uploadImage: jest.fn(),
      deleteFile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HousePlansService,
        { provide: getRepositoryToken(HousePlan), useValue: housePlansRepo },
        { provide: getRepositoryToken(InspectionJob), useValue: jobsRepo },
        { provide: getRepositoryToken(Floor), useValue: floorRepo },
        { provide: StorageService, useValue: storageService },
      ],
    }).compile();

    service = module.get<HousePlansService>(HousePlansService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByJob', () => {
    it('returns plans ordered by orderIndex and createdAt', async () => {
      const mockPlans = [
        { planId: 1, name: 'แปลนชั้น 1', orderIndex: 0 },
        { planId: 2, name: 'แปลนชั้น 2', orderIndex: 1 },
      ];
      housePlansRepo.find.mockResolvedValue(mockPlans);

      const result = await service.findByJob(10);
      expect(result).toEqual(mockPlans);
      expect(housePlansRepo.find).toHaveBeenCalledWith({
        where: { job: { jobId: 10 } },
        order: { orderIndex: 'ASC', createdAt: 'ASC' },
        relations: ['floor'],
      });
    });
  });

  describe('create', () => {
    it('throws BadRequestException if no file provided', async () => {
      await expect(
        service.create(1, undefined, { name: 'แปลนชั้น 1' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException if job does not exist', async () => {
      jobsRepo.findOneBy.mockResolvedValue(null);
      const file = { buffer: Buffer.from('test') } as Express.Multer.File;

      await expect(
        service.create(999, file, { name: 'แปลนชั้น 1' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('successfully creates and saves house plan', async () => {
      const file = { buffer: Buffer.from('test') } as Express.Multer.File;
      const mockJob = { jobId: 1, projectName: 'Project A' };
      const mockFloor = { floorId: 2, label: 'ชั้น 2' };

      jobsRepo.findOneBy.mockResolvedValue(mockJob);
      floorRepo.findOneBy.mockResolvedValue(mockFloor);
      storageService.uploadImage.mockResolvedValue('/plans/test.webp');
      housePlansRepo.create.mockImplementation((val) => val);
      housePlansRepo.save.mockImplementation(async (val) => ({
        planId: 10,
        ...val,
      }));

      const result = await service.create(1, file, {
        name: 'แปลนชั้น 2',
        floorId: 2,
        orderIndex: 1,
      });

      expect(storageService.uploadImage).toHaveBeenCalledWith(
        file.buffer,
        'house-plans',
      );
      expect(result).toMatchObject({
        planId: 10,
        name: 'แปลนชั้น 2',
        imageUrl: '/plans/test.webp',
        orderIndex: 1,
        job: mockJob,
        floor: mockFloor,
      });
    });
  });

  describe('update', () => {
    it('throws NotFoundException if plan does not exist', async () => {
      housePlansRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update(999, { name: 'แปลนชั้น 2' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('renames the plan and saves it', async () => {
      const mockPlan = {
        planId: 5,
        name: 'แปลนชั้น 1',
        imageUrl: '/plans/test.webp',
      };
      housePlansRepo.findOne.mockResolvedValue(mockPlan);
      housePlansRepo.save.mockImplementation(async (val) => val);

      const result = await service.update(5, { name: 'แปลนชั้น 2 (แก้ไข)' });

      expect(housePlansRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ planId: 5, name: 'แปลนชั้น 2 (แก้ไข)' }),
      );
      expect(result.name).toBe('แปลนชั้น 2 (แก้ไข)');
    });
  });

  describe('remove', () => {
    it('deletes storage image and removes plan from repo', async () => {
      const mockPlan = {
        planId: 5,
        name: 'แปลนชั้น 1',
        imageUrl: '/plans/test.webp',
      };
      housePlansRepo.findOne.mockResolvedValue(mockPlan);
      housePlansRepo.remove.mockResolvedValue(mockPlan);

      const result = await service.remove(5);
      expect(storageService.deleteFile).toHaveBeenCalledWith(
        '/plans/test.webp',
      );
      expect(housePlansRepo.remove).toHaveBeenCalledWith(mockPlan);
      expect(result).toEqual(mockPlan);
    });
  });
});
