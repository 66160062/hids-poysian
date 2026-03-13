import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateDefectDto } from './dto/create-defect.dto';
import { UpdateDefectDto } from './dto/update-defect.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Defect } from './entities/defect.entity';
import { Repository } from 'typeorm';

@Injectable()
export class DefectsService {
  constructor(
    @InjectRepository(Defect)
    private readonly defectsRepo: Repository<Defect>,
  ) {}
  async create(createDefectDto: CreateDefectDto): Promise<Defect[]> {
    try {
      const { subCategoryIds, ...defectData } = createDefectDto;
      const defectsToSave = subCategoryIds.map((subId) => {
        return this.defectsRepo.create({
          ...defectData,
          status: defectData.status || 'Pending',
          subCategory: subId,
        });
      });
      return await this.defectsRepo.save(defectsToSave);
    } catch (error) {
      console.error('Error creating defect:', error);
      throw new InternalServerErrorException(
        'ไม่สามารถบันทึกข้อมูล Defect ได้',
      );
    }
  }

  async findAll(): Promise<Defect[]> {
    return await this.defectsRepo.find({
      relations: ['subCategory'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Defect> {
    const defect = await this.defectsRepo.findOne({
      where: { defect_id: id },
      relations: ['subCategory'],
    });

    if (!defect) {
      throw new NotFoundException(`ไม่พบข้อมูล Defect ID: ${id}`);
    }
    return defect;
  }

  async update(id: number, updateDefectDto: UpdateDefectDto): Promise<Defect> {
    const defect = await this.findOne(id);
    const updated = this.defectsRepo.merge(defect, updateDefectDto);
    try {
      return await this.defectsRepo.save(updated);
    } catch (error) {
      console.error('Error creating defect:', error);
      throw new InternalServerErrorException('ไม่สามารถแก้ไขข้อมูลได้');
    }
  }

  async remove(id: number): Promise<{ message: string }> {
    const defect = await this.findOne(id);

    try {
      await this.defectsRepo.softDelete(defect); // จะไปเติมค่าในช่อง deleted_at
      return { message: `ลบข้อมูล Defect ID: ${id} เรียบร้อยแล้ว` };
    } catch (error) {
      console.error('Error removing defect:', error);
      throw new InternalServerErrorException('ไม่สามารถลบข้อมูลได้');
    }
  }
}
