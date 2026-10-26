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
@Controller('summary-templates')
export class SummaryTemplatesController {
  constructor(
    private readonly summaryTemplatesService: SummaryTemplatesService,
  ) {}

  @Post()
  @UseGuards(AuthGuard, AdminGuard)
  create(@Body() createSummaryTemplateDto: CreateSummaryTemplateDto) {
    return this.summaryTemplatesService.create(createSummaryTemplateDto);
  }

  // เปิดให้เรียกได้โดยไม่ต้อง login: หน้ารายงานของลูกค้าที่เข้าผ่านลิงก์ต้องใช้แม่แบบนี้วาดแบบสรุป
  // (ลูกค้าไม่มี Bearer token) ข้อมูลเป็นแค่หัวข้อ/ตัวเลือกของแบบสรุป ไม่มีข้อมูลของงานตรวจรายใด
  @Get()
  findAll() {
    return this.summaryTemplatesService.findAll();
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  findOne(@Param('id') id: string) {
    return this.summaryTemplatesService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, AdminGuard)
  update(
    @Param('id') id: string,
    @Body() updateSummaryTemplateDto: UpdateSummaryTemplateDto,
  ) {
    return this.summaryTemplatesService.update(+id, updateSummaryTemplateDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, AdminGuard)
  remove(@Param('id') id: string) {
    return this.summaryTemplatesService.remove(+id);
  }
}
