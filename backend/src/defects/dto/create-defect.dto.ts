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

  @ApiProperty({ description: 'รหัสห้องใหญ่', example: 1 })
  @Type(() => Number)
  @IsNumber()
  roomId!: number;

  @ApiProperty({ description: 'รหัสห้องย่อย', example: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  subRoomId?: number;

  @ApiProperty({ description: 'รหัสชั้น', example: 1 })
  @Type(() => Number)
  @IsNumber()
  floorId!: number;

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

  @ApiProperty({ description: 'รหัสแปลนบ้าน', example: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  planId?: number;

  @ApiProperty({
    description: 'พิกัดเปอร์เซ็นต์แกน X (0 - 100)',
    example: 45.5,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  planX?: number;

  @ApiProperty({
    description: 'พิกัดเปอร์เซ็นต์แกน Y (0 - 100)',
    example: 60.25,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  planY?: number;

  @ApiProperty({
    description: 'โซนห้อง/ตำแหน่งระบุ (เช่น ผนังฝั่งระเบียง)',
    example: 'ผนังฝั่งระเบียง',
    required: false,
  })
  @IsOptional()
  @IsString()
  locationZone?: string;
}
