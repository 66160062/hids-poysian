import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateHousePlanDto {
  @ApiProperty({
    description: 'ชื่อแปลน (ไม่ใช้เมื่อระบุ floorId)',
    example: 'แปลนชั้น 1',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiProperty({
    description: 'ชื่อแปลนภาษาอังกฤษ (optional)',
    example: 'Floor 1 Plan',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  nameEn?: string | null;

  @ApiProperty({
    description: 'ย้ายแปลนไปชั้นนี้ (ชื่อแปลนจะถูกตั้งตามชั้น)',
    example: 2,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  floorId?: number;
}
