import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DefectsCategory } from './entities/defects-category.entity';
import { CreateDefectsCategoryDto } from './dto/create-defects-category.dto';
import { UpdateDefectsCategoryDto } from './dto/update-defects-category.dto';

@Injectable()
export class DefectsCategoriesService {
  constructor(
    @InjectRepository(DefectsCategory)
    private readonly defectsCategoryRepository: Repository<DefectsCategory>,
  ) {}
  async create(
    createDefectsCategoryDto: CreateDefectsCategoryDto,
  ): Promise<DefectsCategory> {
    try {
      const newCategory = this.defectsCategoryRepository.create(
        createDefectsCategoryDto,
      );
      return await this.defectsCategoryRepository.save(newCategory);
    } catch (error) {
      console.error('Error creating category:', error);
      throw new InternalServerErrorException('ไม่สามารถสร้างหมวดหมู่หลักได้');
    }
  }

  async findAll() {
    return await this.defectsCategoryRepository.find();
  }

  async findOne(id: number): Promise<DefectsCategory> {
    const category = await this.defectsCategoryRepository.findOneOrFail({
      where: { category_id: id },
    });
    if (!category) {
      throw new NotFoundException(`ไม่พบข้อมูลหมวดหมู่หลัก ID: ${id}`);
    }
    return category;
  }
  async update(
    id: number,
    updateDto: UpdateDefectsCategoryDto,
  ): Promise<DefectsCategory> {
    await this.findOne(id);
    await this.defectsCategoryRepository.update(id, updateDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<{ message: string }> {
    const result = await this.defectsCategoryRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`ไม่สามารถลบได้ เนื่องจากไม่พบ ID: ${id}`);
    }
    return { message: `ลบข้อมูลหมวดหมู่หลัก ID: ${id} สำเร็จแล้ว` };
  }
}
