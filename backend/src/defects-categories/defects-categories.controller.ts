import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { DefectsCategoriesService } from './defects-categories.service';
import { CreateDefectsCategoryDto } from './dto/create-defects-category.dto';
import { UpdateDefectsCategoryDto } from './dto/update-defects-category.dto';
import { ApiOperation } from '@nestjs/swagger/dist/decorators/api-operation.decorator';

@Controller('defects-categories')
export class DefectsCategoriesController {
  constructor(
    private readonly defectsCategoriesService: DefectsCategoriesService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'สร้างหมวดหมู่หลักใหม่' })
  create(@Body() createDefectsCategoryDto: CreateDefectsCategoryDto) {
    return this.defectsCategoriesService.create(createDefectsCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'ดึงรายการหมวดหมู่หลักทั้งหมด' })
  findAll() {
    return this.defectsCategoriesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'ดึงข้อมูลหมวดหมู่หลักตาม ID' })
  findOne(@Param('id') id: string) {
    return this.defectsCategoriesService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'อัปเดตข้อมูลหมวดหมู่หลักตาม ID' })
  update(
    @Param('id') id: string,
    @Body() updateDefectsCategoryDto: UpdateDefectsCategoryDto,
  ) {
    return this.defectsCategoriesService.update(+id, updateDefectsCategoryDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'ลบหมวดหมู่หลัก' })
  remove(@Param('id') id: string) {
    return this.defectsCategoriesService.remove(+id);
  }
}
