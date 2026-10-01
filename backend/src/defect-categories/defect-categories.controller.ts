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
import { DefectCategoriesService } from './defect-categories.service';
import { CreateDefectCategoryDto } from './dto/create-defect-category.dto';
import { UpdateDefectCategoryDto } from './dto/update-defect-category.dto';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { AdminGuard } from 'src/auth/admin.guard';

@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('Defect-categories')
export class DefectCategoriesController {
  constructor(
    private readonly defectCategoriesService: DefectCategoriesService,
  ) {}

  @Post()
  @UseGuards(AdminGuard)
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
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'อัปเดตข้อมูลหมวดหมู่หลักตาม ID' })
  update(
    @Param('id') id: string,
    @Body() UpdateDefectCategoryDto: UpdateDefectCategoryDto,
  ) {
    return this.defectCategoriesService.update(+id, UpdateDefectCategoryDto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'ลบหมวดหมู่หลัก' })
  remove(@Param('id') id: string) {
    return this.defectCategoriesService.remove(+id);
  }
}
