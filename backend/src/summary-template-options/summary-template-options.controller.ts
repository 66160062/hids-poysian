import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SummaryTemplateOptionsService } from './summary-template-options.service';
import { CreateSummaryTemplateOptionDto } from './dto/create-summary-template-option.dto';
import { UpdateSummaryTemplateOptionDto } from './dto/update-summary-template-option.dto';

@Controller('summary-template-options')
export class SummaryTemplateOptionsController {
  constructor(private readonly summaryTemplateOptionsService: SummaryTemplateOptionsService) {}

  @Post()
  create(@Body() createSummaryTemplateOptionDto: CreateSummaryTemplateOptionDto) {
    return this.summaryTemplateOptionsService.create(createSummaryTemplateOptionDto);
  }

  @Get()
  findAll() {
    return this.summaryTemplateOptionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.summaryTemplateOptionsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSummaryTemplateOptionDto: UpdateSummaryTemplateOptionDto) {
    return this.summaryTemplateOptionsService.update(+id, updateSummaryTemplateOptionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.summaryTemplateOptionsService.remove(+id);
  }
}
