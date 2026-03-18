import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateDefectsSubCategoryDto } from './dto/create-defects-sub-category.dto';
import { UpdateDefectsSubCategoryDto } from './dto/update-defects-sub-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DefectsSubCategory } from './entities/defects-sub-category.entity';
import { Repository } from 'typeorm/browser/repository/Repository.js';

@Injectable()
export class DefectsSubCategoriesService {
  constructor(
    @InjectRepository(DefectsSubCategory)
    private readonly defectsSubCategoryRepository: Repository<DefectsSubCategory>,
  ) {}

  async create(
    createDto: CreateDefectsSubCategoryDto,
  ): Promise<DefectsSubCategory> {
    try {
      const newSubCategory =
        this.defectsSubCategoryRepository.create(createDto);
      return await this.defectsSubCategoryRepository.save(newSubCategory);
    } catch (error) {
      console.error('Error creating sub category:', error);
      throw new InternalServerErrorException('ไม่สามารถสร้างหมวดหมู่ย่อยได้');
    }
  }

  async findAll() {
    return this.defectsSubCategoryRepository.find();
  }

  async findOne(id: number) {
    return this.defectsSubCategoryRepository.findOneByOrFail({
      subCategoryId: id,
    });
  }

  async update(
    id: number,
    updateDefectsSubCategoryDto: UpdateDefectsSubCategoryDto,
  ) {
    await this.defectsSubCategoryRepository.update(
      id,
      updateDefectsSubCategoryDto,
    );
    return this.findOne(id);
  }

  async remove(id: number) {
    return this.defectsSubCategoryRepository.softDelete(id);
  }
}
