import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { DefectStatus } from '../entities/defect.entity';
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

  @ApiProperty({ description: 'ความรุนแรง', example: 'Minor' })
  @IsString()
  severity: string;

  @ApiProperty({
    enum: DefectStatus,
    example: DefectStatus.PENDING_REPAIR,
    required: false,
  })
  @IsEnum(DefectStatus)
  status?: DefectStatus;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'รูปภาพ defect',
    required: false,
  })
  @IsOptional()
  file?: Express.Multer.File;
}
