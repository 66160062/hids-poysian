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
import { SummaryTemplateOptionsService } from './summary-template-options.service';
import { CreateSummaryTemplateOptionDto } from './dto/create-summary-template-option.dto';
import { UpdateSummaryTemplateOptionDto } from './dto/update-summary-template-option.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { AdminGuard } from 'src/auth/admin.guard';

@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('summary-template-options')
export class SummaryTemplateOptionsController {
  constructor(
    private readonly summaryTemplateOptionsService: SummaryTemplateOptionsService,
  ) {}

  @Post()
  @UseGuards(AdminGuard)
  create(
    @Body() createSummaryTemplateOptionDto: CreateSummaryTemplateOptionDto,
  ) {
    return this.summaryTemplateOptionsService.create(
      createSummaryTemplateOptionDto,
    );
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
  @UseGuards(AdminGuard)
  update(
    @Param('id') id: string,
    @Body() updateSummaryTemplateOptionDto: UpdateSummaryTemplateOptionDto,
  ) {
    return this.summaryTemplateOptionsService.update(
      +id,
      updateSummaryTemplateOptionDto,
    );
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  remove(@Param('id') id: string) {
    return this.summaryTemplateOptionsService.remove(+id);
  }
}
