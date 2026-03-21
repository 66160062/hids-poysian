import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SummaryTemplate } from './entities/summary-template.entity';
import { CreateSummaryTemplateDto } from './dto/create-summary-template.dto';
import { UpdateSummaryTemplateDto } from './dto/update-summary-template.dto';

@Injectable()
export class SummaryTemplatesService {
  constructor(
    @InjectRepository(SummaryTemplate)
    private readonly templatesRepo: Repository<SummaryTemplate>,
  ) {}

  create(dto: CreateSummaryTemplateDto) {
    const template = this.templatesRepo.create(dto);
    return this.templatesRepo.save(template);
  }

  findAll() {
    return this.templatesRepo.find({ relations: ['options'] });
  }

  findOne(id: number) {
    return this.templatesRepo.findOneOrFail({
      where: { templateId: id },
      relations: ['options'],
    });
  }

  async update(id: number, dto: UpdateSummaryTemplateDto) {
    const template = await this.templatesRepo.findOneByOrFail({
      templateId: id,
    });
    Object.assign(template, dto);
    return this.templatesRepo.save(template);
  }

  async remove(id: number) {
    const template = await this.templatesRepo.findOneByOrFail({
      templateId: id,
    });
    return this.templatesRepo.remove(template);
  }
}
