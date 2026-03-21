import { Injectable } from '@nestjs/common';
import { CreateDefectSubCategoryDto } from './dto/create-defect-sub-category.dto';
import { UpdateDefectSubCategoryDto } from './dto/update-defect-sub-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DefectSubCategory } from './entities/defect-sub-category.entity';
import { Repository } from 'typeorm';
import { DefectCategory } from 'src/defect-categories/entities/defect-category.entity';

@Injectable()
export class DefectSubCategoriesService {
  constructor(
    @InjectRepository(DefectSubCategory)
    private readonly DefectSubCategoriesRepository: Repository<DefectSubCategory>,
    @InjectRepository(DefectCategory)
    private readonly DefectCategoriesRepository: Repository<DefectCategory>,
  ) {}

  async create(
    createDto: CreateDefectSubCategoryDto,
  ): Promise<DefectSubCategory> {
    const subCategory = this.DefectSubCategoriesRepository.create(createDto);
    subCategory.category =
      await this.DefectCategoriesRepository.findOneByOrFail({
        categoryId: createDto.categoryId,
      });

    return await this.DefectSubCategoriesRepository.save(subCategory);
  }

  async findAll() {
    return this.DefectSubCategoryRepository.find({
      relations: ['category'],
    });
  }

  async findOne(id: number) {
    return this.DefectSubCategoriesRepository.findOneByOrFail({
      subCategoryId: id,
    });
  }

  async update(
    id: number,
    updateDefectSubCategoryDto: UpdateDefectSubCategoryDto,
  ) {
    const subCategory =
      await this.DefectSubCategoriesRepository.findOneByOrFail({
        subCategoryId: id,
      });
    subCategory.category =
      await this.DefectCategoriesRepository.findOneByOrFail({
        categoryId: updateDefectSubCategoryDto.categoryId,
      });
    await this.DefectSubCategoriesRepository.update(id, subCategory);
    return this.findOne(id);
  }

  async remove(id: number) {
    return this.DefectSubCategoriesRepository.softDelete(id);
  }
}
