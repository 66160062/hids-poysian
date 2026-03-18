import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateDefectSubCategoryDto } from './dto/create-defect-sub-category.dto';
import { UpdateDefectSubCategoryDto } from './dto/update-defect-sub-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DefectSubCategory } from './entities/defect-sub-category.entity';
import { Repository } from 'typeorm';

@Injectable()
export class DefectSubCategoriesService {
  constructor(
    @InjectRepository(DefectSubCategory)
    private readonly DefectSubCategoryRepository: Repository<DefectSubCategory>,
  ) {}

  async create(
    createDto: CreateDefectSubCategoryDto,
  ): Promise<DefectSubCategory> {
    try {
      const newSubCategory = this.DefectSubCategoryRepository.create(createDto);
      return await this.DefectSubCategoryRepository.save(newSubCategory);
    } catch (error) {
      console.error('Error creating sub category:', error);
      throw new InternalServerErrorException('ไม่สามารถสร้างหมวดย่อยได้');
    }
  }

  async findAll() {
    return this.DefectSubCategoryRepository.find();
  }

  async findOne(id: number) {
    return this.DefectSubCategoryRepository.findOneByOrFail({
      subCategoryId: id,
    });
  }

  async update(
    id: number,
    updateDefectSubCategoryDto: UpdateDefectSubCategoryDto,
  ) {
    await this.DefectSubCategoryRepository.update(
      id,
      updateDefectSubCategoryDto,
    );
    return this.findOne(id);
  }

  async remove(id: number) {
    return this.DefectSubCategoryRepository.softDelete(id);
  }
}
