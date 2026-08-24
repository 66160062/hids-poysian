import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { promises as fs } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { InspectionSummaryItem } from './entities/inspection-summary-item.entity';
import { InspectionRound } from 'src/inspection-rounds/entities/inspection-round.entity';
import { SummaryTemplate } from 'src/summary-templates/entities/summary-template.entity';
import { SummaryTemplateOption } from 'src/summary-template-options/entities/summary-template-option.entity';
import { CreateInspectionSummaryItemDto } from './dto/create-inspection-summary-item.dto';
import { UpdateInspectionSummaryItemDto } from './dto/update-inspection-summary-item.dto';
import { CreateInspectionSummaryItemPhotoDto } from './dto/create-inspection-summary-item-photo.dto';

// เก็บไฟล์ไว้ที่ <project-root>/uploads/inspection-photos
// ต้องเปิด static serving path นี้ใน AppModule (ดูคำอธิบายท้ายไฟล์)
const UPLOAD_ROOT = join(process.cwd(), 'uploads', 'inspection-photos');
const PUBLIC_PATH_PREFIX = '/uploads/inspection-photos';
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

    // ถ้าเป็น item ประเภทรูป (option.type === 'photo') ให้ลบไฟล์บน disk ด้วย
    if (item.detailValue?.startsWith(PUBLIC_PATH_PREFIX)) {
      const relativePath = item.detailValue.replace(
        `${PUBLIC_PATH_PREFIX}/`,
        '',
      );
      const absolutePath = join(UPLOAD_ROOT, relativePath);
      await fs.unlink(absolutePath).catch(() => {
        // ไฟล์อาจถูกลบไปแล้ว/ไม่เจอ ไม่ต้อง throw ให้ล้ม การลบ record ทับได้
      });
    }

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

    // โฟลเดอร์: uploads/inspection-photos/round-{roundId}/template-{templateId}/
    const relativeDir = join(
      `round-${dto.roundId}`,
      `template-${dto.templateId}`,
    );
    const targetDir = join(UPLOAD_ROOT, relativeDir);
    await fs.mkdir(targetDir, { recursive: true });

    const ext = file.originalname.split('.').pop() ?? 'jpg';
    const fileName = `${uuidv4()}.${ext}`;
    const absolutePath = join(targetDir, fileName);

    await fs.writeFile(absolutePath, file.buffer);

    // path ที่เก็บใน DB คือ path สาธารณะที่ frontend ใช้ต่อ <base-url> แล้วโหลดรูปได้เลย
    const publicPath =
      `${PUBLIC_PATH_PREFIX}/${relativeDir}/${fileName}`.replace(/\\/g, '/');

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
      detailValue: publicPath,
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
}