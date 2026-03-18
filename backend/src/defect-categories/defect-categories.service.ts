import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DefectCategory } from './entities/defect-category.entity';
import { CreateDefectCategoryDto } from './dto/create-defect-category.dto';
import { UpdateDefectCategoryDto } from './dto/update-defect-category.dto';

@Injectable()
export class DefectCategoriesService {
  constructor(
    @InjectRepository(DefectCategory)
    private readonly defectCategoriesRepository: Repository<DefectCategory>,
  ) {}
  async create(
    createdefectCategoriesDto: CreateDefectCategoryDto,
  ): Promise<DefectCategory> {
    try {
      const newCategory = this.defectCategoriesRepository.create(
        createdefectCategoriesDto,
      );
      return await this.defectCategoriesRepository.save(newCategory);
    } catch (error) {
      console.error('Error creating category:', error);
      throw new InternalServerErrorException('ไม่สามารถสร้างหมวดหมู่หลักได้');
    }
  }

  async findAll() {
    return await this.defectCategoriesRepository.find();
  }

  async findOne(id: number): Promise<DefectCategory> {
    const category = await this.defectCategoriesRepository.findOneOrFail({
      where: { categoryId: id },
    });
    if (!category) {
      throw new NotFoundException(`ไม่พบข้อมูลหมวดหมู่หลัก ID: ${id}`);
    }
    return category;
  }
  async update(
    id: number,
    updateDto: UpdateDefectCategoryDto,
  ): Promise<DefectCategory> {
    await this.findOne(id);
    await this.defectCategoriesRepository.update(id, updateDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<{ message: string }> {
    const result = await this.defectCategoriesRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`ไม่สามารถลบได้ เนื่องจากไม่พบ ID: ${id}`);
    }
    return { message: `ลบข้อมูลหมวดหมู่หลัก ID: ${id} สำเร็จแล้ว` };
  }
}
