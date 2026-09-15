import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateHousePlanDto {
  @ApiProperty({
    description: 'ชื่อแปลน (เช่น แปลนชั้น 1, แปลนชั้น 2)',
    example: 'แปลนชั้น 1',
  })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({
    description: 'ชื่อแปลนภาษาอังกฤษ (optional)',
    example: 'Floor 1 Plan',
    required: false,
  })
  @IsOptional()
  @IsString()
  nameEn?: string;

  @ApiProperty({
    description: 'รหัสชั้น (optional)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  floorId?: number;

  @ApiProperty({
    description: 'ลำดับการแสดงผล',
    example: 0,
    required: false,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  orderIndex?: number;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'ไฟล์รูปแปลน (jpg, png, webp)',
    required: true,
  })
  @IsOptional()
  file?: Express.Multer.File;
}
