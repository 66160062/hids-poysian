import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateHousePlanDto {
  @ApiProperty({
    description: 'ชื่อแปลน (เช่น แปลนชั้น 1, แปลนชั้น 2)',
    example: 'แปลนชั้น 1',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiProperty({
    description: 'ชื่อแปลนภาษาอังกฤษ (optional)',
    example: 'Floor 1 Plan',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  nameEn?: string;
}
