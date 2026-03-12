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
import { DefectsSubCategoriesService } from './defects-sub-categories.service';
import { CreateDefectsSubCategoryDto } from './dto/create-defects-sub-category.dto';
import { UpdateDefectsSubCategoryDto } from './dto/update-defects-sub-category.dto';
import { ApiOperation } from '@nestjs/swagger/dist/decorators/api-operation.decorator';

@Controller('defects-sub-categories')
export class DefectsSubCategoriesController {
  constructor(
    private readonly defectsSubCategoriesService: DefectsSubCategoriesService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'สร้างหมวดหมู่ย่อยใหม่' })
  create(@Body() createDefectsSubCategoryDto: CreateDefectsSubCategoryDto) {
    return this.defectsSubCategoriesService.create(createDefectsSubCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'ดึงรายการหมวดหมู่ย่อยทั้งหมด' })
  findAll() {
    return this.defectsSubCategoriesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'ดึงข้อมูลหมวดหมู่ย่อย 1 รายการ (ตาม ID)' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.defectsSubCategoriesService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'อัปเดตข้อมูลหมวดหมู่ย่อย' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDefectsSubCategoryDto: UpdateDefectsSubCategoryDto,
  ) {
    return this.defectsSubCategoriesService.update(
      id,
      updateDefectsSubCategoryDto,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'ลบหมวดหมู่ย่อย' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.defectsSubCategoriesService.remove(id);
  }
}
