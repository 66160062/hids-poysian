import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString } from 'class-validator';

export class CreateRepairRecordDto {
  @ApiProperty({ description: 'รหัส Defect ที่ต้องการซ่อม', example: 1 })
  @IsInt()
  defectId: number;

  @ApiProperty({ description: 'รหัสผู้รับเหมา', example: 1 })
  @IsInt()
  contractorId: number;

  @ApiProperty({
    description: 'คำอธิบายการซ่อม',
    example: 'ซ่อมรอยร้าวที่ผนัง',
  })
  @IsString()
  description: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'ไฟล์รูปภาพการซ่อม',
  })
  @IsString()
  imageUrl: string;

  @ApiProperty({ description: 'ขนาดไฟล์รูปภาพ (หน่วย: ไบต์)', example: 204800 })
  @IsInt()
  fileSize: number;
}
