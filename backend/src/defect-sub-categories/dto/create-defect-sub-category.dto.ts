import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, MaxLength } from 'class-validator';

export class CreateDefectSubCategoryDto {
  @ApiProperty({ description: 'รหัสหมวดหมู่หลัก', example: 1 })
  @IsInt()
  categoryId!: number;

  @ApiProperty({ description: 'ชื่อหมวดหมู่ย่อย', example: 'รอยร้าว' })
  @IsString()
  @MaxLength(255)
  name!: string;
}
