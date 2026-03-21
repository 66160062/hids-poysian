import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InspectionSummaryItem } from './entities/inspection-summary-item.entity';
import { InspectionRound } from 'src/inspection-rounds/entities/inspection-round.entity';
import { SummaryTemplate } from 'src/summary-templates/entities/summary-template.entity';
import { SummaryTemplateOption } from 'src/summary-template-options/entities/summary-template-option.entity';
import { CreateInspectionSummaryItemDto } from './dto/create-inspection-summary-item.dto';
import { UpdateInspectionSummaryItemDto } from './dto/update-inspection-summary-item.dto';

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
      relations: ['round', 'template', 'option'],
    });
  }

  findOne(id: number) {
    return this.itemsRepo.findOneOrFail({
      where: { itemId: id },
      relations: ['round', 'template', 'option'],
    });
  }

  findByRound(roundId: number) {
    return this.itemsRepo.find({
      where: { round: { roundId } },
      relations: ['template', 'option'],
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
    return this.itemsRepo.remove(item);
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
    return this.itemsRepo.delete({ round: { roundId } });
  }
}
