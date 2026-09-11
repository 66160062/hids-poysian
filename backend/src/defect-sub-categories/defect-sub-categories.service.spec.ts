import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DefectSubCategoriesService } from './defect-sub-categories.service';
import { DefectSubCategory } from './entities/defect-sub-category.entity';
import { DefectCategory } from 'src/defect-categories/entities/defect-category.entity';

describe('DefectSubCategoriesService', () => {
  let service: DefectSubCategoriesService;
  let subCategoriesRepo: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOneByOrFail: jest.Mock;
    update: jest.Mock;
    softDelete: jest.Mock;
  };
  let categoriesRepo: { findOneByOrFail: jest.Mock };

  beforeEach(async () => {
    subCategoriesRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOneByOrFail: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    };
    categoriesRepo = { findOneByOrFail: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DefectSubCategoriesService,
        {
          provide: getRepositoryToken(DefectSubCategory),
          useValue: subCategoriesRepo,
        },
        {
          provide: getRepositoryToken(DefectCategory),
          useValue: categoriesRepo,
        },
      ],
    }).compile();

    service = module.get<DefectSubCategoriesService>(
      DefectSubCategoriesService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('attaches the parent category before saving a new sub-category', async () => {
    subCategoriesRepo.create.mockReturnValue({ subCategoryName: 'รอยแตกผนัง' });
    categoriesRepo.findOneByOrFail.mockResolvedValue({
      categoryId: 1,
      categoryName: 'โครงสร้าง',
    });
    subCategoriesRepo.save.mockImplementation((value) => value);

    const result = await service.create({
      categoryId: 1,
      subCategoryName: 'รอยแตกผนัง',
    } as never);

    expect(categoriesRepo.findOneByOrFail).toHaveBeenCalledWith({
      categoryId: 1,
    });
    expect(result).toMatchObject({
      category: { categoryId: 1 },
    });
  });

  it('rejects creation when the parent category does not exist', async () => {
    subCategoriesRepo.create.mockReturnValue({});
    categoriesRepo.findOneByOrFail.mockRejectedValue(new Error('not found'));

    await expect(
      service.create({ categoryId: 99, subCategoryName: 'x' } as never),
    ).rejects.toThrow('not found');
  });

  it('re-attaches the category when updating a sub-category', async () => {
    subCategoriesRepo.findOneByOrFail.mockResolvedValue({
      subCategoryId: 5,
      subCategoryName: 'เดิม',
    });
    categoriesRepo.findOneByOrFail.mockResolvedValue({ categoryId: 2 });

    await service.update(5, {
      categoryId: 2,
      subCategoryName: 'ใหม่',
    } as never);

    expect(subCategoriesRepo.update).toHaveBeenCalledWith(
      5,
      expect.objectContaining({ category: { categoryId: 2 } }),
    );
  });
});
