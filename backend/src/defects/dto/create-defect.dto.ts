import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsArray,
} from 'class-validator';
import { DefectStatus } from '../entities/defect.entity';
import { Transform, Type } from 'class-transformer';
export class CreateDefectDto {
  @ApiProperty({ description: 'รหัสรอบตรวจ', example: 1 })
  @Type(() => Number)
  @IsNumber()
  roundId!: number;

  @ApiProperty({ description: 'รหัส template ห้อง', example: 1 })
  @Type(() => Number)
  @IsNumber()
  templateId!: number;

  @Transform(({ value }: { value: string | string[] }) => {
    if (Array.isArray(value)) return value.map((v) => Number(v));
    if (typeof value === 'string')
      return value.split(',').map((v) => Number(v.trim()));
    return value;
  })
  @IsArray()
  @IsNumber({}, { each: true })
  subCategoryIds!: number[];

  @ApiProperty({ description: 'รหัสผู้ตรวจ', example: 1 })
  @Type(() => Number)
  @IsNumber()
  inspectorId!: number;

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
  severity!: string;

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
