import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber } from 'class-validator';
export class CreateDefectDto {
  @ApiProperty({ description: 'รหัสรอบตรวจ', example: 1 })
  @IsNumber()
  roundId: number;

  @ApiProperty({ description: 'รหัส template ห้อง', example: 1 })
  @IsNumber()
  templateId: number;

  @ApiProperty({ description: 'รหัสหมวดหมู่ย่อย', example: 1 })
  @IsNumber()
  subCategoryId: number;

  @ApiProperty({ description: 'รหัสผู้ตรวจ', example: 1 })
  @IsNumber()
  inspectorId: number;

  @ApiProperty({
    description: 'รายละเอียด',
    example: 'ผนังแตกร้าว',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'ความรุนแรง', example: 'HIGH' })
  @IsString()
  severity: string;

  @ApiProperty({ description: 'สถานะ', example: 'OPEN', required: false })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'รูปภาพ defect',
    required: false,
  })
  @IsOptional()
  file?: Express.Multer.File;
}
