import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { InspectionSummaryItem } from './entities/inspection-summary-item.entity';
import { InspectionRound } from 'src/inspection-rounds/entities/inspection-round.entity';
import { SummaryTemplate } from 'src/summary-templates/entities/summary-template.entity';
import { SummaryTemplateOption } from 'src/summary-template-options/entities/summary-template-option.entity';
import { CreateInspectionSummaryItemDto } from './dto/create-inspection-summary-item.dto';
import { UpdateInspectionSummaryItemDto } from './dto/update-inspection-summary-item.dto';
import { CreateInspectionSummaryItemPhotoDto } from './dto/create-inspection-summary-item-photo.dto';
import { RoundSummaryItemDto } from './dto/replace-round-summary-items.dto';
import { StorageService } from 'src/storage/storage.service';

const PHOTO_OPTION_TYPE = 'photo';

@Injectable()
export class InspectionSummaryItemsService {
  constructor(
    @InjectRepository(InspectionSummaryItem)
    private readonly itemsRepo: Repository<InspectionSummaryItem>,

    @InjectRepository(InspectionRound)
    private readonly roundsRepo: Repository<InspectionRound>,

    @InjectRepository(SummaryTemplate)
    private readonly templatesRepo: Repository<SummaryTemplate>,

    @InjectRepository(SummaryTemplateOption)
    private readonly optionsRepo: Repository<SummaryTemplateOption>,

    private readonly dataSource: DataSource,

    private readonly storageService: StorageService,
  ) {}

  async create(dto: CreateInspectionSummaryItemDto) {
    const round = await this.roundsRepo.findOneByOrFail({
      roundId: dto.roundId,
    });
    const template = await this.templatesRepo.findOneByOrFail({
      templateId: dto.templateId,
    });
    const option = await this.optionsRepo.findOneByOrFail({
      optionId: dto.optionId,
    });

    const item = this.itemsRepo.create({
      round,
      template,
      option,
      detailValue: dto.detailValue,
    });

    return this.itemsRepo.save(item);
  }

  findAll() {
    return this.itemsRepo.find({
      relations: ['round', 'template', 'option', 'refItem'],
    });
  }

  findOne(id: number) {
    return this.itemsRepo.findOneOrFail({
      where: { itemId: id },
      relations: ['round', 'template', 'option', 'refItem'],
    });
  }

  findByRound(roundId: number) {
    return this.itemsRepo.find({
      where: { round: { roundId } },
      relations: ['template', 'option', 'refItem'],
    });
  }

  async update(id: number, dto: UpdateInspectionSummaryItemDto) {
    const item = await this.itemsRepo.findOneByOrFail({ itemId: id });

    if (dto.optionId) {
      item.option = await this.optionsRepo.findOneByOrFail({
        optionId: dto.optionId,
      });
    }
    if (dto.detailValue !== undefined) {
      item.detailValue = dto.detailValue;
    }

    return this.itemsRepo.save(item);
  }

  async remove(id: number) {
    const item = await this.itemsRepo.findOneByOrFail({ itemId: id });

    await this.storageService.deleteFile(item.detailValue);

    return this.itemsRepo.remove(item);
  }

  async createPhotoItem(
    file: Express.Multer.File,
    dto: CreateInspectionSummaryItemPhotoDto,
  ) {
    if (!file) {
      throw new BadRequestException('ไม่พบไฟล์รูปภาพ');
    }

    const round = await this.roundsRepo.findOneByOrFail({
      roundId: dto.roundId,
    });
    const template = await this.templatesRepo.findOneByOrFail({
      templateId: dto.templateId,
    });
    const option = await this.optionsRepo.findOneByOrFail({
      optionId: dto.optionId,
    });

    if (option.type !== 'photo') {
      throw new BadRequestException(
        `option_id ${dto.optionId} ไม่ใช่ option ประเภท photo`,
      );
    }

    const photoUrl = await this.storageService.uploadImage(
      file.buffer,
      `inspection-photos/round-${dto.roundId}/template-${dto.templateId}`,
    );

    let refItem: InspectionSummaryItem | undefined;
    if (dto.refItemId) {
      refItem =
        (await this.itemsRepo.findOneBy({ itemId: dto.refItemId })) ??
        undefined;
    }

    const item = this.itemsRepo.create({
      round,
      template,
      option,
      refItem,
      detailValue: photoUrl,
    });

    return this.itemsRepo.save(item);
  }

  async upsert(dto: CreateInspectionSummaryItemDto) {
    // เช็คว่ามีอยู่แล้วไหม
    const existing = await this.itemsRepo.findOne({
      where: {
        round: { roundId: dto.roundId },
        template: { templateId: dto.templateId },
        option: { optionId: dto.optionId },
      },
    });

    if (existing) return existing; // มีแล้วไม่ต้องทำอะไร

    return this.create(dto); // ไม่มีค่อย insert
  }

  async deleteByRoundAndTemplate(roundId: number, templateId: number) {
    return this.itemsRepo.delete({
      round: { roundId },
      template: { templateId },
    });
  }

  async deleteByRound(roundId: number) {
    // สำคัญ: ต้อง "ไม่" ลบ item ประเภท photo ไปด้วย เพราะหน้ารายงานเรียก endpoint นี้
    // ทุกครั้งที่กด "บันทึกรายงาน" เพื่อล้างคำตอบเก่าก่อนสร้างใหม่ (ไม่ใช่ล้างรูปที่อัปโหลดไว้แล้ว)
    const photoItems = await this.itemsRepo.find({
      where: { round: { roundId }, option: { type: PHOTO_OPTION_TYPE } },
      select: { itemId: true },
    });
    const keepIds = photoItems.map((i) => i.itemId);

    if (keepIds.length === 0) {
      return this.itemsRepo.delete({ round: { roundId } });
    }

    return this.itemsRepo
      .createQueryBuilder()
      .delete()
      .from(InspectionSummaryItem)
      .where('round_id = :roundId', { roundId })
      .andWhere('item_id NOT IN (:...keepIds)', { keepIds })
      .execute();
  }

  async replaceForRound(roundId: number, items: RoundSummaryItemDto[]) {
    const round = await this.roundsRepo.findOneByOrFail({ roundId });

    const templateIds = [...new Set(items.map((i) => i.templateId))];
    const optionIds = [...new Set(items.map((i) => i.optionId))];

    const [templates, options] = await Promise.all([
      templateIds.length
        ? this.templatesRepo.findBy({ templateId: In(templateIds) })
        : Promise.resolve<SummaryTemplate[]>([]),
      optionIds.length
        ? this.optionsRepo.findBy({ optionId: In(optionIds) })
        : Promise.resolve<SummaryTemplateOption[]>([]),
    ]);

    const templateById = new Map(templates.map((t) => [t.templateId, t]));
    const optionById = new Map(options.map((o) => [o.optionId, o]));

    const rows = items.map((item) => {
      const template = templateById.get(item.templateId);
      const option = optionById.get(item.optionId);
      if (!template || !option) {
        throw new BadRequestException(
          `ไม่พบหัวข้อ ${item.templateId} หรือตัวเลือก ${item.optionId}`,
        );
      }
      return { round, template, option, detailValue: item.detailValue ?? '' };
    });

    // ต้องเก็บ item ประเภทรูปไว้ เพราะรายการที่ส่งมาแทนที่เป็นแค่คำตอบ ไม่รวมรูปที่อัปโหลดแยกไว้
    return this.dataSource.transaction(async (manager) => {
      await manager
        .createQueryBuilder()
        .delete()
        .from(InspectionSummaryItem)
        .where('round_id = :roundId', { roundId })
        .andWhere(
          `option_id IS NULL OR option_id NOT IN (SELECT option_id FROM summary_template_option WHERE type = :photo)`,
          { photo: PHOTO_OPTION_TYPE },
        )
        .execute();
      if (!rows.length) return [];
      return manager.save(manager.create(InspectionSummaryItem, rows));
    });
  }
}
