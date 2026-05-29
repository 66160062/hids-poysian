import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateInspectionJobDto {
  @ApiProperty({
    description: 'รหัสลูกค้า (Customer ID)',
    example: 1,
  })
  @Type(() => Number)
  @IsNumber()
  customerId: number;

  @ApiProperty({
    description: 'ประเภทการตรวจ',
    example: 'ตรวจ Defect',
    maxLength: 50,
  })
  @IsString()
  @MaxLength(50)
  inspectionType: string;

  @ApiProperty({ description: 'รหัสที่อยู่โครงการ (Address ID)', example: 1 })
  @Type(() => Number)
  @IsNumber()
  addressId: number;

  @ApiProperty({ description: 'ไอดีประเภทบ้าน', example: '1' })
  @Type(() => Number)
  @IsNumber()
  houseTypeId: number;

  @ApiProperty({ description: 'ชื่อโครงการ', example: 'หมู่บ้านแสนสุข วิลเลจ' })
  @IsString()
  @MaxLength(255)
  projectName: string;

  @ApiProperty({
    description: 'พิกัดแผนที่ (Latitude, Longitude)',
    example: '13.7563,100.5018',
  })
  @IsString()
  @MaxLength(255)
  locationCoordinate: string;

  @ApiProperty({
    description: 'ลิงก์ไฟล์แปลนบ้าน',
    example: 'https://example.com/plan.pdf',
  })
  @IsString()
  @MaxLength(255)
  housePlanUrl: string;

  @ApiProperty({ description: 'พื้นที่ใช้สอย (ตารางเมตร)', example: 150.5 })
  @Type(() => Number)
  @IsNumber()
  usableArea: number;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'ลิงก์รูปภาพหน้าโครงการ',
    required: false,
  })
  @IsString()
  @IsOptional()
  projectImageUrl?: string;

  @ApiProperty({
    description: 'สถานะของงาน',
    enum: ['Draft', 'Active', 'Completed', 'Cancelled'],
    default: 'Draft',
  })
  @IsString()
  @MaxLength(50)
  @IsEnum(['Draft', 'Active', 'Completed', 'Cancelled'])
  status: string;
}
