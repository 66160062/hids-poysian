import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { DefectCategoriesService } from './defect-categories.service';
import { CreateDefectCategoryDto } from './dto/create-defect-category.dto';
import { UpdateDefectCategoryDto } from './dto/update-defect-category.dto';
import { ApiOperation } from '@nestjs/swagger';

@Controller('Defect-categories')
export class DefectCategoriesController {
  constructor(
    private readonly defectCategoriesService: DefectCategoriesService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'สร้างหมวดหมู่หลักใหม่' })
  create(@Body() CreateDefectCategoryDto: CreateDefectCategoryDto) {
    return this.defectCategoriesService.create(CreateDefectCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'ดึงรายการหมวดหมู่หลักทั้งหมด' })
  findAll() {
    return this.defectCategoriesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'ดึงข้อมูลหมวดหมู่หลักตาม ID' })
  findOne(@Param('id') id: string) {
    return this.defectCategoriesService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'อัปเดตข้อมูลหมวดหมู่หลักตาม ID' })
  update(
    @Param('id') id: string,
    @Body() UpdateDefectCategoryDto: UpdateDefectCategoryDto,
  ) {
    return this.defectCategoriesService.update(+id, UpdateDefectCategoryDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'ลบหมวดหมู่หลัก' })
  remove(@Param('id') id: string) {
    return this.defectCategoriesService.remove(+id);
  }
}
