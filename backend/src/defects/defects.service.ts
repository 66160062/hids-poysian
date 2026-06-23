import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Defect } from './entities/defect.entity';
import { CreateDefectDto } from './dto/create-defect.dto';
import { UpdateDefectDto } from './dto/update-defect.dto';
import { ContractorUpdateDefectDto } from './dto/contractor-update-defect.dto';
import { InspectionRound } from 'src/inspection-rounds/entities/inspection-round.entity';
import { DefectSubCategory } from 'src/defect-sub-categories/entities/defect-sub-category.entity';
import { User } from 'src/users/entities/user.entity';
import { DefectStatus } from './entities/defect.entity';
import { Contractor } from 'src/contractor/entities/contractor.entity';

@Injectable()
export class DefectsService {
  constructor(
    @InjectRepository(Defect)
    private readonly defectsRepo: Repository<Defect>,

    @InjectRepository(InspectionRound)
    private readonly roundsRepo: Repository<InspectionRound>,

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
    const subCategories = await this.subCategoriesRepo.findBy({
      subCategoryId: In(createDefectDto.subCategoryIds),
    });
    const inspector = await this.usersRepo.findOneByOrFail({
      id: createDefectDto.inspectorId,
    });

    const defect = this.defectsRepo.create({
      ...createDefectDto,
      round,
      room: { roomId: createDefectDto.roomId } as any,
      floor: { floorId: createDefectDto.floorId } as any,
      subRoom: createDefectDto.subRoomId ? { subRoomId: createDefectDto.subRoomId } as any : null,
      subCategories,
      inspector,
      imageFileSize: createDefectDto.imageFileSize,
    });

    return this.defectsRepo.save(defect);
  }

  findAll() {
    return this.defectsRepo.find({
      relations: ['round', 'room', 'subRoom', 'floor', 'subCategories', 'inspector'],
    });
  }

  findOne(id: number) {
    return this.defectsRepo.findOneOrFail({
      where: { defectId: id },
      relations: ['round', 'room', 'subRoom', 'floor', 'subCategories', 'inspector'],
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

  async contractorUpdate(
    contractorUpdateDto: ContractorUpdateDefectDto & {
      contractorImageUrl?: string;
      contractorImageFileSize?: number;
    },
  ) {
    const defect = await this.defectsRepo.findOneOrFail({
      where: { defectId: contractorUpdateDto.defectId },
      relations: ['round', 'round.job', 'round.job.contractor'],
    });

    const assignedContractorId = defect.round?.job?.contractor?.contractorId;
    if (assignedContractorId !== contractorUpdateDto.contractorId) {
      throw new ForbiddenException('Contractor cannot update this defect');
    }

    defect.status = DefectStatus.REPAIRED;
    defect.contractorNote = contractorUpdateDto.note ?? defect.contractorNote;
    defect.updatedBy = {
      contractorId: contractorUpdateDto.contractorId,
    } as Contractor;

    if (contractorUpdateDto.contractorImageUrl) {
      defect.contractorImageUrl = contractorUpdateDto.contractorImageUrl;
      defect.contractorImageFileSize =
        contractorUpdateDto.contractorImageFileSize ??
        defect.contractorImageFileSize;
    }

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
        'room',
        'subRoom',
        'floor',
      ],
    });
  }
}
