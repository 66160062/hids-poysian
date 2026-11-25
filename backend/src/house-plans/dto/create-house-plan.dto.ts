import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateHousePlanDto {
  @ApiProperty({
    description: 'ชื่อแปลน (ไม่ใช้ — ระบบตั้งชื่อจากชั้นเอง)',
    example: 'แปลนชั้น 1',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'ชื่อแปลนภาษาอังกฤษ (optional)',
    example: 'Floor 1 Plan',
    required: false,
  })
  @IsOptional()
  @IsString()
  nameEn?: string;

  @ApiProperty({
    description: 'รหัสชั้น (หนึ่งงานมีได้หนึ่งแปลนต่อชั้น)',
    example: 1,
  })
  @Type(() => Number)
  @IsNumber()
  floorId!: number;

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
