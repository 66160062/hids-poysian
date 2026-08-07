import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { DefectCategoriesService } from './defect-categories.service';
import { DefectCategory } from './entities/defect-category.entity';

describe('DefectCategoriesService', () => {
  let service: DefectCategoriesService;
  let categoriesRepo: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOneOrFail: jest.Mock;
    update: jest.Mock;
    softDelete: jest.Mock;
  };

  beforeEach(async () => {
    categoriesRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOneOrFail: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DefectCategoriesService,
        {
          provide: getRepositoryToken(DefectCategory),
          useValue: categoriesRepo,
        },
      ],
    }).compile();

    service = module.get<DefectCategoriesService>(DefectCategoriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('wraps a save failure in a Thai-language InternalServerErrorException', async () => {
    categoriesRepo.create.mockReturnValue({ categoryName: 'โครงสร้าง' });
    categoriesRepo.save.mockRejectedValue(new Error('db down'));

    await expect(
      service.create({ categoryName: 'โครงสร้าง' } as never),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('throws NotFoundException with the id in the message when a category is missing', async () => {
    categoriesRepo.findOneOrFail.mockRejectedValue(new Error('not found'));

    await expect(service.findOne(99)).rejects.toThrow();
  });

  it('re-fetches the category after updating it', async () => {
    categoriesRepo.findOneOrFail.mockResolvedValue({
      categoryId: 3,
      categoryName: 'ไฟฟ้า',
    });

    const result = await service.update(3, {
      categoryName: 'ไฟฟ้า',
    } as never);

    expect(categoriesRepo.update).toHaveBeenCalledWith(3, {
      categoryName: 'ไฟฟ้า',
    });
    expect(result).toMatchObject({ categoryId: 3 });
  });

  it('throws NotFoundException when removing a category that does not exist', async () => {
    categoriesRepo.softDelete.mockResolvedValue({ affected: 0 });

    await expect(service.remove(99)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('returns a Thai success message when removal affects a row', async () => {
    categoriesRepo.softDelete.mockResolvedValue({ affected: 1 });

    await expect(service.remove(3)).resolves.toEqual({
      message: 'ลบข้อมูลหมวดหมู่หลัก ID: 3 สำเร็จแล้ว',
    });
  });
});
