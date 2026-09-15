import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateDefectCategoryDto {
  @ApiProperty({ description: 'ชื่อหมวดหมู่', example: 'โครงสร้าง' })
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiProperty({
    description: 'ชื่อหมวดหมู่ภาษาอังกฤษ',
    example: 'Structure',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  nameEn?: string;
}
