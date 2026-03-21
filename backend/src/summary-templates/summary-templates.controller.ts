import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SummaryTemplatesService } from './summary-templates.service';
import { CreateSummaryTemplateDto } from './dto/create-summary-template.dto';
import { UpdateSummaryTemplateDto } from './dto/update-summary-template.dto';

@Controller('summary-templates')
export class SummaryTemplatesController {
  constructor(private readonly summaryTemplatesService: SummaryTemplatesService) {}

  @Post()
  create(@Body() createSummaryTemplateDto: CreateSummaryTemplateDto) {
    return this.summaryTemplatesService.create(createSummaryTemplateDto);
  }

  @Get()
  findAll() {
    return this.summaryTemplatesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.summaryTemplatesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSummaryTemplateDto: UpdateSummaryTemplateDto) {
    return this.summaryTemplatesService.update(+id, updateSummaryTemplateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.summaryTemplatesService.remove(+id);
  }
}
