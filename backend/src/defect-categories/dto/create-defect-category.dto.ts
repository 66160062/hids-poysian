import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class CreateDefectCategoryDto {
  @ApiProperty({ description: 'ชื่อหมวดหมู่', example: 'โครงสร้าง' })
  @IsString()
  @MaxLength(255)
  name: string;
}
