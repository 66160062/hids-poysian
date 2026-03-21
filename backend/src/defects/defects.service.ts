import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Defect } from './entities/defect.entity';
import { CreateDefectDto } from './dto/create-defect.dto';
import { UpdateDefectDto } from './dto/update-defect.dto';
import { InspectionRound } from 'src/inspection-rounds/entities/inspection-round.entity';
import { RoomTemplate } from 'src/room-templates/entities/room-template.entity';
import { DefectSubCategory } from 'src/defect-sub-categories/entities/defect-sub-category.entity';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class DefectsService {
  constructor(
    @InjectRepository(Defect)
    private readonly defectsRepo: Repository<Defect>,

    @InjectRepository(InspectionRound)
    private readonly roundsRepo: Repository<InspectionRound>,

    @InjectRepository(RoomTemplate)
    private readonly templatesRepo: Repository<RoomTemplate>,

    @InjectRepository(DefectSubCategory)
    private readonly subCategoriesRepo: Repository<DefectSubCategory>,

    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async create(
    createDefectDto: CreateDefectDto & {
      imageUrl?: string;
      imageFileSize?: number;
    },
  ) {
    const round = await this.roundsRepo.findOneByOrFail({
      roundId: createDefectDto.roundId,
    });
    const template = await this.templatesRepo.findOneByOrFail({
      templateId: createDefectDto.templateId,
    });
    const subCategories = await this.subCategoriesRepo.findBy({
      subCategoryId: In(createDefectDto.subCategoryIds),
    });
    const inspector = await this.usersRepo.findOneByOrFail({
      id: createDefectDto.inspectorId,
    });

    const defect = this.defectsRepo.create({
      ...createDefectDto,
      round,
      template,
      subCategories,
      inspector,
      imageFileSize: createDefectDto.imageFileSize,
    });

    return this.defectsRepo.save(defect);
  }

  findAll() {
    return this.defectsRepo.find({
      relations: ['round', 'template', 'subCategories', 'inspector'],
    });
  }

  findOne(id: number) {
    return this.defectsRepo.findOneOrFail({
      where: { defectId: id },
      relations: ['round', 'template', 'subCategories', 'inspector'],
    });
  }

  async update(
    id: number,
    updateDefectDto: UpdateDefectDto & {
      imageUrl?: string;
      imageFileSize?: number;
    },
  ) {
    const defect = await this.defectsRepo.findOneByOrFail({ defectId: id });
    Object.assign(defect, updateDefectDto);
    return this.defectsRepo.save(defect);
  }

  async remove(id: number) {
    const defect = await this.defectsRepo.findOneByOrFail({ defectId: id });
    return this.defectsRepo.remove(defect);
  }

  findByRound(roundId: number) {
    return this.defectsRepo.find({
      where: { round: { roundId } },
      relations: [
        'round',
        'subCategories',
        'subCategories.category',
        'inspector',
        'template',
        'template.floor',
        'template.subRoom',
      ],
    });
  }
}
