import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { DefectSubCategoriesService } from './defect-sub-categories.service';
import { CreateDefectSubCategoryDto } from './dto/create-defect-sub-category.dto';
import { UpdateDefectSubCategoryDto } from './dto/update-defect-sub-category.dto';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { AdminGuard } from 'src/auth/admin.guard';

@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('defect-sub-categories')
export class DefectSubCategoriesController {
  constructor(
    private readonly defectSubCategoriesService: DefectSubCategoriesService,
  ) {}

  @Post()
  @UseGuards(AdminGuard)
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
  @UseGuards(AdminGuard)
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
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'ลบหมวดย่อย' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.defectSubCategoriesService.remove(id);
  }
}
