import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SummaryTemplateOption } from './entities/summary-template-option.entity';

import { CreateSummaryTemplateOptionDto } from './dto/create-summary-template-option.dto';
import { UpdateSummaryTemplateOptionDto } from './dto/update-summary-template-option.dto';
import { SummaryTemplate } from 'src/summary-templates/entities/summary-template.entity';

@Injectable()
export class SummaryTemplateOptionsService {
  constructor(
    @InjectRepository(SummaryTemplateOption)
    private readonly optionsRepo: Repository<SummaryTemplateOption>,

    @InjectRepository(SummaryTemplate)
    private readonly templatesRepo: Repository<SummaryTemplate>,
  ) {}

  async create(dto: CreateSummaryTemplateOptionDto) {
    const template = await this.templatesRepo.findOneByOrFail({
      templateId: dto.templateId,
    });
    const option = this.optionsRepo.create({ value: dto.value, template });
    return this.optionsRepo.save(option);
  }

  findAll() {
    return this.optionsRepo.find({ relations: ['template'] });
  }

  findOne(id: number) {
    return this.optionsRepo.findOneOrFail({
      where: { optionId: id },
      relations: ['template'],
    });
  }

  async update(id: number, dto: UpdateSummaryTemplateOptionDto) {
    const option = await this.optionsRepo.findOneByOrFail({ optionId: id });
    Object.assign(option, dto);
    return this.optionsRepo.save(option);
  }

  async remove(id: number) {
    const option = await this.optionsRepo.findOneByOrFail({ optionId: id });
    return this.optionsRepo.remove(option);
  }
}
