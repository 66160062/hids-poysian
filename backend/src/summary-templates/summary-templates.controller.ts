import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { SummaryTemplatesService } from './summary-templates.service';
import { CreateSummaryTemplateDto } from './dto/create-summary-template.dto';
import { UpdateSummaryTemplateDto } from './dto/update-summary-template.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { AdminGuard } from 'src/auth/admin.guard';

@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('summary-templates')
export class SummaryTemplatesController {
  constructor(
    private readonly summaryTemplatesService: SummaryTemplatesService,
  ) {}

  @Post()
  @UseGuards(AdminGuard)
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
  @UseGuards(AdminGuard)
  update(
    @Param('id') id: string,
    @Body() updateSummaryTemplateDto: UpdateSummaryTemplateDto,
  ) {
    return this.summaryTemplatesService.update(+id, updateSummaryTemplateDto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  remove(@Param('id') id: string) {
    return this.summaryTemplatesService.remove(+id);
  }
}
