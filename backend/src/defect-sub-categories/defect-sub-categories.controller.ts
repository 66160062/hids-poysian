import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { DefectSubCategoriesService } from './defect-sub-categories.service';
import { CreateDefectSubCategoryDto } from './dto/create-defect-sub-category.dto';
import { UpdateDefectSubCategoryDto } from './dto/update-defect-sub-category.dto';
import { ApiOperation } from '@nestjs/swagger';

@Controller('defect-sub-categories')
export class DefectSubCategoriesController {
  constructor(
    private readonly defectSubCategoriesService: DefectSubCategoriesService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'สร้างหมวดย่อยใหม่' })
  create(@Body() createDefectSubCategoryDto: CreateDefectSubCategoryDto) {
    return this.defectSubCategoriesService.create(createDefectSubCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'ดึงรายการหมวดย่อยทั้งหมด' })
  findAll() {
    return this.defectSubCategoriesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'ดึงข้อมูลหมวดย่อย 1 รายการ (ตาม ID)' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.defectSubCategoriesService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'อัปเดตข้อมูลหมวดย่อย' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDefectSubCategoryDto: UpdateDefectSubCategoryDto,
  ) {
    return this.defectSubCategoriesService.update(
      id,
      updateDefectSubCategoryDto,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'ลบหมวดย่อย' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.defectSubCategoriesService.remove(id);
  }
}
